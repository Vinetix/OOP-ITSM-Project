package com.itsm.user;

/**
 * The three user roles. Each role corresponds to exactly one User subclass.
 * Spring Security expects authorities prefixed with "ROLE_".
 */
public enum Role {
    EMPLOYEE,
    TECHNICIAN,
    ADMIN;

    public String authority() {
        return "ROLE_" + name();
    }
}
