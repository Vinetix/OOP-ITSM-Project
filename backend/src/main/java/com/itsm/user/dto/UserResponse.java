package com.itsm.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.catalog.dto.SkillSummary;
import com.itsm.user.Employee;
import com.itsm.user.Role;
import com.itsm.user.Technician;
import com.itsm.user.User;
import org.hibernate.Hibernate;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/**
 * What the API returns for a user. Never exposes the password hash.
 * Role-specific fields are null (and omitted from JSON) for other roles.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        String phone,
        boolean active,
        Instant createdAt,
        // EMPLOYEE
        String department,
        // TECHNICIAN
        Boolean available,
        Boolean senior,
        Integer maxActiveIncidents,
        Integer experienceYears,
        List<SkillSummary> skills
) {

    public static UserResponse from(User source) {
        // A lazily-loaded user may be a Hibernate proxy; unwrap it so instanceof sees the real subclass.
        User user = (User) Hibernate.unproxy(source);

        String department = null;
        Boolean available = null;
        Boolean senior = null;
        Integer maxActiveIncidents = null;
        Integer experienceYears = null;
        List<SkillSummary> skills = null;

        if (user instanceof Employee employee) {
            department = employee.getDepartment();
        } else if (user instanceof Technician technician) {
            available = technician.isAvailable();
            senior = technician.isSenior();
            maxActiveIncidents = technician.getMaxActiveIncidents();
            experienceYears = technician.getExperienceYears();
            skills = technician.getSkills().stream()
                    .map(SkillSummary::from)
                    .sorted(Comparator.comparing(SkillSummary::name))
                    .toList();
        }

        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getPhone(),
                user.isActive(), user.getCreatedAt(),
                department, available, senior, maxActiveIncidents, experienceYears, skills);
    }
}
