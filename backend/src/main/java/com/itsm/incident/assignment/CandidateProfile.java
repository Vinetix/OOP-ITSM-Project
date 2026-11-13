package com.itsm.incident.assignment;

/**
 * Snapshot of one AVAILABLE technician, as seen for one particular incident.
 * Built by AssignmentService from the database; strategies only read it.
 *
 * @param skilledInCategory has an active skill in the incident's category
 * @param resolvedOnService incidents on the same service this technician resolved before
 */
public record CandidateProfile(
        Long technicianId,
        String fullName,
        boolean senior,
        int experienceYears,
        long activeIncidents,
        int maxActiveIncidents,
        boolean skilledInCategory,
        long resolvedOnService
) {

    /** 1.0 = no active incidents, 0.0 = at the limit. */
    public double freeCapacityRatio() {
        double free = Math.max(0, maxActiveIncidents - activeIncidents);
        return free / maxActiveIncidents;
    }

    public int freeCapacityPercent() {
        return (int) Math.round(100 * freeCapacityRatio());
    }

    public String workloadText() {
        return activeIncidents + " of " + maxActiveIncidents + " slots in use (" + freeCapacityPercent() + "% free)";
    }

    public String experienceText() {
        return experienceYears == 1 ? "1 year's experience" : experienceYears + " years' experience";
    }
}
