package com.itsm.notification.channel;

import com.itsm.notification.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Factory: decides which channels deliver a given message.
 * Every message goes to the in-app inbox; important ones are also emailed, so inboxes aren't flooded.
 */
@Component
@RequiredArgsConstructor
public class NotificationChannelFactory {

    private final InAppNotificationChannel inApp;
    private final EmailNotificationChannel email;

    public List<NotificationChannel> channelsFor(NotificationMessage message) {
        return message.important() ? List.of(inApp, email) : List.of(inApp);
    }
}
