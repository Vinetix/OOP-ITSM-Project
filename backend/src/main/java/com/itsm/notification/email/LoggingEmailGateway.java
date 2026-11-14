package com.itsm.notification.email;

import lombok.extern.slf4j.Slf4j;

/** Simulated email: prints the message to the console. Used when no SMTP server is configured. */
@Slf4j
public class LoggingEmailGateway implements EmailGateway {

    @Override
    public String mode() {
        return "SIMULATED";
    }

    @Override
    public void send(EmailMessage message) {
        log.info("[EMAIL simulated] To: {} | Subject: {}\n{}", message.to(), message.subject(), message.text());
    }
}
