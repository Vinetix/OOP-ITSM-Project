package com.itsm.notification.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Sends emails on a background thread, so a slow or unreachable mail server never delays an API
 * response. A failed email is logged; it never affects the incident or the in-app notification.
 *
 * Pacing: real SMTP providers limit how fast you may send (Mailtrap's free sandbox allows 1 email per
 * 10 seconds and rejects more with "550 Too many emails per second"). Emails are therefore sent at least
 * app.mail.min-interval-ms apart (default 1500 ms; set 10000 for Mailtrap free; simulated emails are not
 * paced), and an email rejected for sending too fast is retried with a wait of at least that interval.
 *
 * Demo seeding: withoutRealEmails(...) skips REAL (SMTP) emails on the calling thread, so resetting the demo
 * data doesn't spend the provider's monthly quota. Simulated emails and in-app notifications are unaffected.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AsyncEmailSender {

    static final int MAX_ATTEMPTS = 3;
    static final long RETRY_EXTRA_WAIT_MS = 3000;

    private final EmailGateway gateway;

    @Value("${app.mail.min-interval-ms:1500}")
    private long minIntervalMs;

    private static final ThreadLocal<Boolean> SKIP_REAL_EMAILS = ThreadLocal.withInitial(() -> false);

    private final Object pacing = new Object();
    private long nextSlotMillis;

    /** Runs the action without sending real (SMTP) emails from this thread. */
    public void withoutRealEmails(Runnable action) {
        boolean previous = SKIP_REAL_EMAILS.get();
        SKIP_REAL_EMAILS.set(true);
        try {
            action.run();
        } finally {
            SKIP_REAL_EMAILS.set(previous);
        }
    }

    /** True on a thread inside withoutRealEmails(...) while real SMTP is configured. Call before send(). */
    public boolean skipsRealEmailsHere() {
        return SKIP_REAL_EMAILS.get() && !"SIMULATED".equals(gateway.mode());
    }

    @Async
    public void send(EmailMessage message) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (!waitForSlot(attempt == 1 ? 0 : Math.max(RETRY_EXTRA_WAIT_MS, minIntervalMs))) {
                return; // interrupted (application shutting down)
            }
            try {
                gateway.send(message);
                return;
            } catch (RuntimeException e) {
                if (attempt < MAX_ATTEMPTS && isRateLimited(e)) {
                    log.info("Mail server says too many emails; retrying email to {} (attempt {} of {})",
                            message.to(), attempt + 1, MAX_ATTEMPTS);
                    continue;
                }
                log.warn("Email to {} failed ({}): {}", message.to(), gateway.mode(), e.getMessage());
                return;
            }
        }
    }

    /** Reserves the next sending slot (shared by all threads) and sleeps until it. */
    private boolean waitForSlot(long extraWaitMs) {
        if (minIntervalMs <= 0 || "SIMULATED".equals(gateway.mode())) {
            return true;
        }
        long waitMs;
        synchronized (pacing) {
            long now = System.currentTimeMillis();
            long slot = Math.max(now + extraWaitMs, nextSlotMillis);
            nextSlotMillis = slot + minIntervalMs;
            waitMs = slot - now;
        }
        if (waitMs <= 0) {
            return true;
        }
        try {
            Thread.sleep(waitMs);
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /** True for "slow down" answers such as Mailtrap's "550 5.7.0 Too many emails per second". */
    static boolean isRateLimited(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message != null) {
                String lower = message.toLowerCase(Locale.ROOT);
                if (lower.contains("too many emails") || lower.contains("rate limit") || lower.contains("too many requests")) {
                    return true;
                }
            }
        }
        return false;
    }
}
