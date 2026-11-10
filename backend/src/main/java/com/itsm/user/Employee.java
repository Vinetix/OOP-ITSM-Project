package com.itsm.user;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** An Employee IS-A User who reports incidents. */
@Getter
@Entity
@Table(name = "employees")
@DiscriminatorValue("EMPLOYEE")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Employee extends User {

    @Column(length = 100)
    private String department;

    public Employee(String fullName, String email, String passwordHash, String phone, String department) {
        super(fullName, email, passwordHash, phone);
        this.department = blankToNull(department);
    }

    @Override
    public Role getRole() {
        return Role.EMPLOYEE;
    }

    public void changeDepartment(String department) {
        this.department = blankToNull(department);
    }
}
