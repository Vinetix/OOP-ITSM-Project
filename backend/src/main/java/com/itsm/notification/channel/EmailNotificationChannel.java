package com.itsm.notification.channel;

import com.itsm.notification.NotificationMessage;
import com.itsm.notification.email.AsyncEmailSender;
import com.itsm.notification.email.EmailMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Turns a notification into an email and hands it to the (asynchronous) sender.
 * Only plain strings leave this method, so the background thread never touches JPA entities.
 */
@Component
@RequiredArgsConstructor
public class EmailNotificationChannel implements NotificationChannel {

    private final AsyncEmailSender sender;

    @Override
    public String name() {
        return "EMAIL";
    }

    @Override
    public void deliver(NotificationMessage message) {
        String subject = "[I-ITSM] " + message.title();
        String text = "Hello " + message.recipient().getFullName() + ",\n\n"
                + message.body() + "\n\n"
                + (message.incidentNumber() == null ? "" : "Incident: " + message.incidentNumber() + "\n")
                + "\nThis is an automatic message from the I-ITSM service desk.";
        sender.send(new EmailMessage(message.recipient().getEmail(), subject, text));
    }
}
