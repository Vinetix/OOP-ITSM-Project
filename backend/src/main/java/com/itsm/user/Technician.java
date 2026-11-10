package com.itsm.user;

import com.itsm.common.exception.InvalidRequestException;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * A Technician IS-A User who investigates and resolves incidents.
 * The fields here feed the assignment strategies (Phase 4) and escalation (Phase 6):
 * availability, workload limit, seniority and experience. Skills are added in Phase 2.
 */
@Getter
@Entity
@Table(name = "technicians")
@DiscriminatorValue("TECHNICIAN")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Technician extends User {

    public static final int DEFAULT_MAX_ACTIVE_INCIDENTS = 5;

    /** False when on leave / off shift; unavailable technicians are never auto-assigned. */
    @Column(nullable = false)
    private boolean available = true;

    /** Senior technicians are the level-2 target for automatic escalation. */
    @Column(nullable = false)
    private boolean senior = false;

    /** Workload cap: assignment fails with an exception beyond this many open incidents. */
    @Column(nullable = false)
    private int maxActiveIncidents = DEFAULT_MAX_ACTIVE_INCIDENTS;

    @Column(nullable = false)
    private int experienceYears = 0;

    public Technician(String fullName, String email, String passwordHash, String phone,
                      boolean senior, int maxActiveIncidents, int experienceYears) {
        super(fullName, email, passwordHash, phone);
        updateWorkProfile(senior, maxActiveIncidents, experienceYears);
    }

    @Override
    public Role getRole() {
        return Role.TECHNICIAN;
    }

    /** Guards its own invariants: the object can never hold an invalid workload limit. */
    public void updateWorkProfile(boolean senior, int maxActiveIncidents, int experienceYears) {
        if (maxActiveIncidents < 1) {
            throw new InvalidRequestException("maxActiveIncidents must be at least 1");
        }
        if (experienceYears < 0) {
            throw new InvalidRequestException("experienceYears cannot be negative");
        }
        this.senior = senior;
        this.maxActiveIncidents = maxActiveIncidents;
        this.experienceYears = experienceYears;
    }

    public void changeAvailability(boolean available) {
        this.available = available;
    }
}
