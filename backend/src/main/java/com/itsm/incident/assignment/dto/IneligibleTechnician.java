package com.itsm.incident.assignment.dto;

/** A technician who can't take this incident right now, and why. */
public record IneligibleTechnician(Long technicianId, String fullName, String reason) {
}
