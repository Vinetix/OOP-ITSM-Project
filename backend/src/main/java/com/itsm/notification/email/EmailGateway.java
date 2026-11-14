package com.itsm.notification.email;

/**
 * Our own email interface (the "target" of the Adapter pattern). The rest of the app depends on this,
 * never on a mail library, so the provider can change without touching notification code.
 */
public interface EmailGateway {

    /** e.g. "SMTP" or "SIMULATED" (shown in the startup log). */
    String mode();

    void send(EmailMessage message);
}
