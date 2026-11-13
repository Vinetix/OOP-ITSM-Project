package com.itsm.incident.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.catalog.dto.CategorySummary;
import com.itsm.catalog.dto.ServiceSummary;
import com.itsm.incident.Incident;
import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.priority.Urgency;
import com.itsm.incident.state.IncidentAction;
import com.itsm.incident.state.IncidentStatus;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Full incident detail. allowedActions tells the frontend exactly which buttons to show
 * for THIS user right now (state rules + permissions combined on the server).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record IncidentResponse(
        Long id,
        String number,
        String title,
        String description,
        IncidentStatus status,
        Priority priority,
        int priorityScore,
        String priorityReason,
        Impact impact,
        Urgency urgency,
        int affectedUsers,
        CategorySummary category,
        ServiceSummary service,
        PersonRef reporter,
        PersonRef assignedTechnician,
        Instant assignedAt,
        SlaView sla,
        String resolutionSummary,
        String rootCause,
        Integer feedbackRating,
        String feedbackComment,
        Instant verifiedAt,
        Instant closedAt,
        String closureNote,
        Instant createdAt,
        Instant updatedAt,
        List<NoteResponse> notes,
        Set<IncidentAction> allowedActions,
        boolean canEdit,
        boolean canAddNote
) {

    public static IncidentResponse from(Incident i, Set<IncidentAction> allowedActions,
                                        boolean canEdit, boolean canAddNote, Instant now) {
        return new IncidentResponse(
                i.getId(), i.getNumber(), i.getTitle(), i.getDescription(), i.getStatus(),
                i.getPriority(), i.getPriorityScore(), i.getPriorityReason(),
                i.getImpact(), i.getUrgency(), i.getAffectedUsers(),
                CategorySummary.from(i.getCategory()), ServiceSummary.from(i.getService()),
                PersonRef.from(i.getReporter()), PersonRef.from(i.getAssignedTechnician()), i.getAssignedAt(),
                SlaView.from(i.getSla(), now),
                i.getResolutionSummary(), i.getRootCause(),
                i.getFeedbackRating(), i.getFeedbackComment(),
                i.getVerifiedAt(), i.getClosedAt(), i.getClosureNote(),
                i.getCreatedAt(), i.getUpdatedAt(),
                i.getNotes().stream().map(NoteResponse::from).toList(),
                allowedActions, canEdit, canAddNote);
    }
}
