package com.itsm.incident.sla;

import com.itsm.incident.Incident;
import com.itsm.incident.priority.Priority;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Instant;

import static com.itsm.support.TestFixtures.T0;
import static com.itsm.support.TestFixtures.p1Sla;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Escalation levels at 1.0×, 1.5× and 2.0× the response target (P1: 5, 7.5, 10 minutes). */
class EscalationPolicyTest {

    private final EscalationPolicy policy = new EscalationPolicy();

    private static Incident incident(Priority priority, boolean awaitingAcknowledgement) {
        Incident incident = mock(Incident.class);
        when(incident.getPriority()).thenReturn(priority);
        when(incident.isAwaitingAcknowledgement()).thenReturn(awaitingAcknowledgement);
        when(incident.getSla()).thenReturn(SlaTracking.start(p1Sla(), T0));
        return incident;
    }

    @ParameterizedTest(name = "{0} seconds after the report → level {1}")
    @CsvSource({"299, 0", "300, 1", "449, 1", "450, 2", "599, 2", "600, 3", "1800, 3"})
    void levelsForAnUnacknowledgedP1(long seconds, int expectedLevel) {
        Instant now = T0.plusSeconds(seconds);
        assertThat(policy.levelDue(incident(Priority.P1, true), now)).isEqualTo(expectedLevel);
    }

    @Test
    @DisplayName("P3/P4 incidents are never escalated")
    void lowPriorityNotEscalated() {
        assertThat(policy.levelDue(incident(Priority.P3, true), T0.plusSeconds(3600))).isZero();
    }

    @Test
    @DisplayName("Acknowledged (or unassigned) incidents are never escalated")
    void acknowledgedNotEscalated() {
        assertThat(policy.levelDue(incident(Priority.P1, false), T0.plusSeconds(3600))).isZero();
    }

    @Test
    @DisplayName("Each level has a readable description")
    void descriptions() {
        assertThat(EscalationPolicy.describe(1)).contains("technician");
        assertThat(EscalationPolicy.describe(2)).contains("senior");
        assertThat(EscalationPolicy.describe(3)).contains("admins");
    }
}
