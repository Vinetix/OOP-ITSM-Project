package com.itsm.notification.email;

/** A plain email: no JPA entities, so it is safe to pass to a background thread. */
public record EmailMessage(String to, String subject, String text) {
}
