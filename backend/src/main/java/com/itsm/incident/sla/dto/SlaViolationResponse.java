package com.itsm.incident.sla.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.SlaTarget;
import com.itsm.incident.sla.SlaViolation;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SlaViolationResponse(
        Long id,
        Long incidentId,
        String incidentNumber,
        SlaTarget target,
        Priority priority,
        int targetMinutes,
        Instant dueAt,
        Instant detectedAt,
        String serviceName,
        Long technicianId,
        String technicianName
) {

    public static SlaViolationResponse from(SlaViolation v) {
        return new SlaViolationResponse(v.getId(), v.getIncident().getId(), v.getIncidentNumber(), v.getTarget(),
                v.getPriority(), v.getTargetMinutes(), v.getDueAt(), v.getDetectedAt(), v.getServiceName(),
                v.getTechnicianId(), v.getTechnicianName());
    }
}
