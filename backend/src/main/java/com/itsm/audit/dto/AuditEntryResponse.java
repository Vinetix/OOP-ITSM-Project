package com.itsm.audit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.audit.AuditAction;
import com.itsm.audit.AuditLog;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Role;

import java.time.Instant;

/** One audit line. actorId and actorRole are absent for system actions (actorName is "System"). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuditEntryResponse(
        Long id,
        Instant occurredAt,
        Long incidentId,
        String incidentNumber,
        Long actorId,
        String actorName,
        Role actorRole,
        boolean system,
        AuditAction action,
        IncidentStatus fromStatus,
        IncidentStatus toStatus,
        String details
) {

    public static AuditEntryResponse from(AuditLog log) {
        return new AuditEntryResponse(log.getId(), log.getOccurredAt(), log.getIncidentId(), log.getIncidentNumber(),
                log.getActorId(), log.getActorName(), log.getActorRole(), log.isSystemAction(), log.getAction(),
                log.getFromStatus(), log.getToStatus(), log.getDetails());
    }
}
