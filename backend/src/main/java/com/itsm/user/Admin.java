package com.itsm.user;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/** An Admin (IT Manager) IS-A User who configures the system and monitors operations. */
@Entity
@Table(name = "admins")
@DiscriminatorValue("ADMIN")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Admin extends User {

    public Admin(String fullName, String email, String passwordHash, String phone) {
        super(fullName, email, passwordHash, phone);
    }

    @Override
    public Role getRole() {
        return Role.ADMIN;
    }
}
