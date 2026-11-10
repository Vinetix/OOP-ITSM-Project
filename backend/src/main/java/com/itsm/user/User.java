package com.itsm.user;

import com.itsm.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Locale;

/**
 * Abstract base of the user hierarchy: User -> Employee, Technician, Admin.
 *
 * - Abstraction: you can never create a plain "User"; every user is one of the three kinds.
 * - Inheritance (JOINED): common columns live in table "users"; role-specific columns live in
 *   "employees", "technicians", "admins", linked by the same id. The "role" discriminator column
 *   tells Hibernate which subclass a row belongs to.
 * - Polymorphism: getRole() is abstract; each subclass answers for itself.
 * - Encapsulation: no public setters. State changes only through intention-revealing methods
 *   (updateProfile, changePasswordHash, deactivate, ...).
 */
@Getter
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "role", discriminatorType = DiscriminatorType.STRING, length = 20)
@NoArgsConstructor(access = AccessLevel.PROTECTED) // required by JPA, hidden from application code
public abstract class User extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Only the BCrypt hash is ever stored, never the plain password. */
    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    protected User(String fullName, String email, String passwordHash, String phone) {
        this.fullName = fullName.trim();
        this.email = normalizeEmail(email);
        this.passwordHash = passwordHash;
        this.phone = blankToNull(phone);
    }

    /** Each subclass states its own role (polymorphism). */
    public abstract Role getRole();

    public void updateProfile(String fullName, String phone) {
        this.fullName = fullName.trim();
        this.phone = blankToNull(phone);
    }

    public void changePasswordHash(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    protected static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
