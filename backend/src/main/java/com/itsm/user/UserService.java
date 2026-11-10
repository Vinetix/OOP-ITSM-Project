package com.itsm.user;

import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.common.exception.DuplicateResourceException;
import com.itsm.common.exception.InvalidRequestException;
import com.itsm.common.exception.ResourceNotFoundException;
import com.itsm.common.exception.UnauthorizedOperationException;
import com.itsm.common.web.PageResponse;
import com.itsm.user.dto.ChangePasswordRequest;
import com.itsm.user.dto.CreateUserRequest;
import com.itsm.user.dto.UpdateProfileRequest;
import com.itsm.user.dto.UpdateUserRequest;
import com.itsm.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Business logic for users. Controllers stay thin and only translate HTTP <-> method calls.
 * Every public method returns DTOs, never entities.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;
    private final UserFactory userFactory;
    private final PasswordEncoder passwordEncoder;

    // ---------------- creation ----------------

    public UserResponse create(CreateUserRequest request) {
        String email = User.normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("A user with email " + email + " already exists");
        }
        User saved = userRepository.save(userFactory.create(request));
        return UserResponse.from(saved);
    }

    // ---------------- queries ----------------

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return UserResponse.from(findUser(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> search(Role role, Boolean active, String text, Pageable pageable) {
        Specification<User> spec = UserSpecifications.all();
        if (role != null) {
            spec = spec.and(UserSpecifications.hasRole(role));
        }
        if (active != null) {
            spec = spec.and(UserSpecifications.isActive(active));
        }
        if (text != null && !text.isBlank()) {
            spec = spec.and(UserSpecifications.nameOrEmailContains(text));
        }
        return PageResponse.from(userRepository.findAll(spec, pageable).map(UserResponse::from));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listTechnicians(boolean availableOnly) {
        List<Technician> technicians = availableOnly
                ? technicianRepository.findAllByActiveTrueAndAvailableTrueOrderByFullNameAsc()
                : technicianRepository.findAllByOrderByFullNameAsc();
        return technicians.stream().map(UserResponse::from).toList();
    }

    // ---------------- updates by admin ----------------

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = findUser(id);
        user.updateProfile(request.fullName(), request.phone());

        // Role-specific data: pattern matching picks the right subclass.
        if (user instanceof Employee employee && request.department() != null) {
            employee.changeDepartment(request.department());
        }
        if (user instanceof Technician technician) {
            technician.updateWorkProfile(
                    Objects.requireNonNullElse(request.senior(), technician.isSenior()),
                    Objects.requireNonNullElse(request.maxActiveIncidents(), technician.getMaxActiveIncidents()),
                    Objects.requireNonNullElse(request.experienceYears(), technician.getExperienceYears()));
            if (request.available() != null) {
                technician.changeAvailability(request.available());
            }
        }
        // No save() call needed: the entity is managed, so changes are written on commit.
        return UserResponse.from(user);
    }

    public UserResponse activate(Long id) {
        User user = findUser(id);
        user.activate();
        return UserResponse.from(user);
    }

    public UserResponse deactivate(Long id, Long actingAdminId) {
        if (id.equals(actingAdminId)) {
            throw new BusinessRuleViolationException("You cannot deactivate your own account");
        }
        User user = findUser(id);
        user.deactivate();
        return UserResponse.from(user);
    }

    // ---------------- self-service ----------------

    public UserResponse updateOwnProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.updateProfile(request.fullName(), request.phone());
        return UserResponse.from(user);
    }

    public void changeOwnPassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("New password must be different from the current password");
        }
        user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    public UserResponse setOwnAvailability(Long userId, boolean available) {
        if (!(findUser(userId) instanceof Technician technician)) {
            throw new UnauthorizedOperationException("Only technicians have an availability status");
        }
        technician.changeAvailability(available);
        return UserResponse.from(technician);
    }

    // ---------------- helpers ----------------

    private User findUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return (User) Hibernate.unproxy(user);
    }
}
