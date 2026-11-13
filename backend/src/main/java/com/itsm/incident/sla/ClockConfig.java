package com.itsm.incident.sla;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * All "what time is it?" questions go through this Clock bean instead of Instant.now().
 * Tests can replace it with a fixed clock to check SLA deadlines and breaches deterministically.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
