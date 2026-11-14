package com.itsm.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.notification.Notification;
import com.itsm.notification.NotificationType;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String body,
        Long incidentId,
        String incidentNumber,
        boolean important,
        boolean read,
        Instant createdAt,
        Instant readAt
) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getBody(), n.getIncidentId(),
                n.getIncidentNumber(), n.isImportant(), n.isRead(), n.getCreatedAt(), n.getReadAt());
    }
}
