package com.itsm.notification;

import com.itsm.user.User;

/**
 * One message for one recipient, before delivery. Every channel receives the same message and
 * decides how to present it (a stored inbox row, an email, ...).
 *
 * @param important important messages are also emailed (see NotificationChannelFactory)
 */
public record NotificationMessage(
        User recipient,
        NotificationType type,
        String title,
        String body,
        Long incidentId,
        String incidentNumber,
        boolean important
) {
}
