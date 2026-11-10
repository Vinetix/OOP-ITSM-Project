package com.itsm.user;

import com.itsm.common.web.PageResponse;
import com.itsm.security.UserPrincipal;
import com.itsm.user.dto.AvailabilityRequest;
import com.itsm.user.dto.ChangePasswordRequest;
import com.itsm.user.dto.CreateUserRequest;
import com.itsm.user.dto.UpdateProfileRequest;
import com.itsm.user.dto.UpdateUserRequest;
import com.itsm.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Thin controller: validates input, checks the role (@PreAuthorize), delegates to UserService.
 * @AuthenticationPrincipal injects the logged-in user, taken from the JWT.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Profiles (all roles) and user management (ADMIN)")
public class UserController {

    private final UserService userService;

    // ---------------- any logged-in user ----------------

    @GetMapping("/me")
    @Operation(summary = "Get my own profile")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal me) {
        return userService.getById(me.getId());
    }

    @PutMapping("/me")
    @Operation(summary = "Update my name and phone")
    public UserResponse updateMe(@AuthenticationPrincipal UserPrincipal me,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateOwnProfile(me.getId(), request);
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Change my password")
    public void changePassword(@AuthenticationPrincipal UserPrincipal me,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changeOwnPassword(me.getId(), request);
    }

    @PatchMapping("/me/availability")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "TECHNICIAN: mark myself available / unavailable")
    public UserResponse setMyAvailability(@AuthenticationPrincipal UserPrincipal me,
                                          @Valid @RequestBody AvailabilityRequest request) {
        return userService.setOwnAvailability(me.getId(), request.available());
    }

    // ---------------- ADMIN only ----------------

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: search users (optional filters: role, active, search text)")
    public PageResponse<UserResponse> search(
            @RequestParam(name = "role", required = false) Role role,
            @RequestParam(name = "active", required = false) Boolean active,
            @RequestParam(name = "search", required = false) String search,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return userService.search(role, active, search, pageable);
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: list technicians (for manual assignment / workload screens)")
    public List<UserResponse> technicians(
            @RequestParam(name = "availableOnly", defaultValue = "false") boolean availableOnly) {
        return userService.listTechnicians(availableOnly);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: get a user by id")
    public UserResponse getById(@PathVariable("id") Long id) {
        return userService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ADMIN: create a user of any role")
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: edit a user (role and email cannot change)")
    public UserResponse update(@PathVariable("id") Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: re-enable a user account")
    public UserResponse activate(@PathVariable("id") Long id) {
        return userService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: disable a user account (they can no longer log in)")
    public UserResponse deactivate(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return userService.deactivate(id, me.getId());
    }
}
