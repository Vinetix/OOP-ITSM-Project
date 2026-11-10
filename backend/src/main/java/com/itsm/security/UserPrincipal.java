package com.itsm.security;

import com.itsm.user.Role;
import com.itsm.user.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Adapter between our domain User and Spring Security's UserDetails interface.
 * Keeping this separate means the User entity does not depend on Spring Security at all.
 * Controllers receive this object via @AuthenticationPrincipal.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String fullName;
    private final Role role;
    private final String passwordHash;
    private final boolean active;
    private final List<GrantedAuthority> authorities;

    private UserPrincipal(Long id, String email, String fullName, Role role, String passwordHash, boolean active) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.passwordHash = passwordHash;
        this.active = active;
        this.authorities = List.of(new SimpleGrantedAuthority(role.authority()));
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(user.getId(), user.getEmail(), user.getFullName(), user.getRole(),
                user.getPasswordHash(), user.isActive());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /** Deactivated users are rejected at login and on every request. */
    @Override
    public boolean isEnabled() {
        return active;
    }
}
