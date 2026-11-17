package com.itsm.notification;

import com.itsm.notification.email.AsyncEmailSenderAccess;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AsyncEmailSenderTest {

    @Test
    @DisplayName("Recognises 'slow down' answers from the mail server, also when wrapped")
    void recognisesRateLimits() {
        RuntimeException mailtrap = new RuntimeException("Failed messages",
                new IllegalStateException("550 5.7.0 Too many emails per second. Please upgrade your plan"));
        assertThat(AsyncEmailSenderAccess.isRateLimited(mailtrap)).isTrue();
        assertThat(AsyncEmailSenderAccess.isRateLimited(new RuntimeException("535 Authentication failed"))).isFalse();
    }
}
