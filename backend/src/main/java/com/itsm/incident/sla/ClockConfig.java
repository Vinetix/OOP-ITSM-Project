package com.itsm.incident.sla;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * All "what time is it?" questions go through this Clock bean instead of Instant.now().
 * Tests can replace it with a fixed clock; the demo seeder uses AdjustableClock.runAt() to create
 * historical data (see AdjustableClock).
 */
@Configuration
public class ClockConfig {

    @Bean
    public AdjustableClock clock() {
        return new AdjustableClock(Clock.systemUTC());
    }
}
