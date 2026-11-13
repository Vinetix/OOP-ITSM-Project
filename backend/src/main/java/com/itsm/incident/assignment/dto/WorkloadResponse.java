package com.itsm.incident.assignment.dto;

import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Technician;

import java.util.EnumMap;
import java.util.Map;

/**
 * A technician's current workload. byStatus always lists the four active statuses
 * (ASSIGNED, ACKNOWLEDGED, IN_PROGRESS, AWAITING_INFO), with 0 where there are none.
 */
public record WorkloadResponse(
        Long technicianId,
        String fullName,
        boolean active,
        boolean available,
        boolean senior,
        long activeIncidents,
        int maxActiveIncidents,
        int loadPercent,
        boolean acceptingWork,
        Map<IncidentStatus, Long> byStatus
) {

    public static WorkloadResponse of(Technician technician, Map<IncidentStatus, Long> counts) {
        Map<IncidentStatus, Long> byStatus = new EnumMap<>(IncidentStatus.class);
        for (IncidentStatus status : IncidentStatus.ACTIVE_WORK) {
            byStatus.put(status, counts.getOrDefault(status, 0L));
        }
        long active = byStatus.values().stream().mapToLong(Long::longValue).sum();
        int max = technician.getMaxActiveIncidents();
        int loadPercent = (int) Math.round(100.0 * active / max);
        boolean accepting = technician.isActive() && technician.isAvailable() && active < max;
        return new WorkloadResponse(technician.getId(), technician.getFullName(), technician.isActive(),
                technician.isAvailable(), technician.isSenior(), active, max, loadPercent, accepting, byStatus);
    }
}
