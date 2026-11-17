package com.itsm.support;

import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.boot.test.context.SpringBootTest;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Starts the whole application against the test database (schema recreated, demo data seeded once and
 * shared by all integration test classes). The background SLA monitor is off (tests drive it
 * explicitly), email is always simulated and AI is off (no real Gemini calls from tests).
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed.enabled=true",
        "app.sla.monitor.enabled=false",
        "spring.mail.host=",
        "app.ai.gemini.api-key="
})
@EnabledIf(value = "com.itsm.support.TestDatabase#isAvailable",
        disabledReason = "Test database not reachable (CREATE DATABASE itsm_test;)")
public @interface IntegrationTest {
}
