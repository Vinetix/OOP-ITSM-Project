package com.itsm.incident.dto;

import com.itsm.user.Role;
import com.itsm.user.User;

/** Minimal user reference inside incident responses (never the full profile). */
public record PersonRef(Long id, String fullName, Role role) {

    public static PersonRef from(User user) {
        return user == null ? null : new PersonRef(user.getId(), user.getFullName(), user.getRole());
    }
}
