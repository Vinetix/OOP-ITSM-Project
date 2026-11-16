package com.itsm.integration;

import com.itsm.incident.sla.AdjustableClock;
import com.itsm.incident.sla.SlaMonitor;
import com.itsm.support.IntegrationTest;
import com.itsm.support.IntegrationTestBase;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The SLA monitor and automatic escalation (Workflow 3, second half). Instead of waiting 10 real
 * minutes, the test runs the monitor "as if" it were later, using the application clock.
 */
@IntegrationTest
class SlaEscalationIntegrationTest extends IntegrationTestBase {

    @Autowired
    private AdjustableClock clock;

    @Autowired
    private SlaMonitor monitor;

    private void runMonitorAt(Instant at) {
        clock.runAt(at, monitor::run);
    }

    @Test
    @DisplayName("An unacknowledged P1 escalates to level 1, 2 and 3 at 5, 7.5 and 10 minutes, with a violation recorded")
    void unacknowledgedP1Escalates() throws Exception {
        String incident = report(KIRAN, "Customer lookups failing", "CRM customer search returns nothing.",
                "Customer Database", "HIGH", "HIGH", 80);
        long id = id(incident);
        Instant start = Instant.parse(JsonPath.read(incident, "$.sla.startedAt"));

        runMonitorAt(start.plus(Duration.ofSeconds(330)));
        call(ADMIN, get("/api/incidents/{id}", id))
                .andExpect(jsonPath("$.escalationLevel").value(1))
                .andExpect(jsonPath("$.sla.responseBreached").value(true));

        runMonitorAt(start.plus(Duration.ofSeconds(480)));
        call(ADMIN, get("/api/incidents/{id}", id)).andExpect(jsonPath("$.escalationLevel").value(2));

        runMonitorAt(start.plus(Duration.ofSeconds(660)));
        call(ADMIN, get("/api/incidents/{id}", id)).andExpect(jsonPath("$.escalationLevel").value(3));

        String number = JsonPath.read(incident, "$.number");
        call(ADMIN, get("/api/sla/violations").param("incidentNumber", number))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].target").value("RESPONSE"));

        List<String> actions = JsonPath.read(json(call(ADMIN, get("/api/incidents/{id}/history", id))), "$[*].action");
        assertThat(actions).contains("SLA_BREACHED");
        assertThat(actions.stream().filter("ESCALATED"::equals).count()).isEqualTo(3);
    }

    @Test
    @DisplayName("An incident acknowledged in time is never escalated")
    void acknowledgedInTimeIsNotEscalated() throws Exception {
        String incident = report(KIRAN, "Customer export job stuck", "Nightly customer export never finishes.",
                "Customer Database", "HIGH", "HIGH", 80);
        long id = id(incident);
        Instant start = Instant.parse(JsonPath.read(incident, "$.sla.startedAt"));
        String technician = TECHNICIAN_EMAILS.get(JsonPath.<String>read(incident, "$.assignedTechnician.fullName"));
        call(technician, post("/api/incidents/{id}/acknowledge", id)).andExpect(status().isOk());

        runMonitorAt(start.plus(Duration.ofSeconds(660)));
        call(ADMIN, get("/api/incidents/{id}", id))
                .andExpect(jsonPath("$.escalationLevel").value(0))
                .andExpect(jsonPath("$.sla.responseBreached").value(false));
    }
}
