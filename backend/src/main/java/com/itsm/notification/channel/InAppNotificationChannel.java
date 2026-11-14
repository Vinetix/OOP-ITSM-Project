package com.itsm.notification.channel;

import com.itsm.notification.Notification;
import com.itsm.notification.NotificationMessage;
import com.itsm.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Stores the message so it appears in the recipient's inbox (the bell icon in the UI). */
@Component
@RequiredArgsConstructor
public class InAppNotificationChannel implements NotificationChannel {

    private final NotificationRepository repository;

    @Override
    public String name() {
        return "IN_APP";
    }

    @Override
    public void deliver(NotificationMessage message) {
        repository.save(new Notification(message));
    }
}
