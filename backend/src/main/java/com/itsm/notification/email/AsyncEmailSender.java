package com.itsm.notification.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Sends emails on a background thread, so a slow or unreachable mail server never delays an API
 * response. A failed email is logged; it never affects the incident or the in-app notification.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AsyncEmailSender {

    private final EmailGateway gateway;

    @Async
    public void send(EmailMessage message) {
        try {
            gateway.send(message);
        } catch (RuntimeException e) {
            log.warn("Email to {} failed ({}): {}", message.to(), gateway.mode(), e.getMessage());
        }
    }
}
