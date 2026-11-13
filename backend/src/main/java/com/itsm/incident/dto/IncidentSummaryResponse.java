package com.itsm.incident.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.catalog.dto.CategorySummary;
import com.itsm.catalog.dto.ServiceSummary;
import com.itsm.incident.Incident;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.SlaStatus;
import com.itsm.incident.state.IncidentStatus;

import java.time.Instant;

/** One row in an incident list. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record IncidentSummaryResponse(
        Long id,
        String number,
        String title,
        IncidentStatus status,
        Priority priority,
        CategorySummary category,
        ServiceSummary service,
        PersonRef reporter,
        PersonRef assignedTechnician,
        Instant createdAt,
        Instant responseDueAt,
        Instant resolutionDueAt,
        SlaStatus slaStatus
) {

    public static IncidentSummaryResponse from(Incident i, Instant now) {
        var sla = i.getSla();
        return new IncidentSummaryResponse(i.getId(), i.getNumber(), i.getTitle(), i.getStatus(), i.getPriority(),
                CategorySummary.from(i.getCategory()), ServiceSummary.from(i.getService()),
                PersonRef.from(i.getReporter()), PersonRef.from(i.getAssignedTechnician()),
                i.getCreatedAt(),
                sla == null ? null : sla.getResponseDueAt(),
                sla == null ? null : sla.getResolutionDueAt(),
                sla == null ? null : sla.statusAt(now));
    }
}
