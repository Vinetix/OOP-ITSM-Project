package com.itsm.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.incident.Incident;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.state.IncidentStatus;

import java.time.Instant;
import java.util.List;

/**
 * A possible duplicate. Deliberately contains no reporter or technician details, because employees see
 * this list on the report form. duplicateOfNumber is present when the candidate is itself a duplicate
 * (link to that primary instead).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SimilarIncidentResponse(
        Long incidentId,
        String number,
        String title,
        IncidentStatus status,
        Priority priority,
        String serviceName,
        Instant reportedAt,
        int score,
        List<String> sharedWords,
        boolean sameService,
        boolean sameCategory,
        String duplicateOfNumber
) {

    public static SimilarIncidentResponse from(Incident i, int score, List<String> sharedWords,
                                               boolean sameService, boolean sameCategory) {
        return new SimilarIncidentResponse(i.getId(), i.getNumber(), i.getTitle(), i.getStatus(), i.getPriority(),
                i.getService().getName(), i.getReportedAt(), score, List.copyOf(sharedWords), sameService, sameCategory,
                i.getDuplicateOf() == null ? null : i.getDuplicateOf().getNumber());
    }
}
