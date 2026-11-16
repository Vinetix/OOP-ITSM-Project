package com.itsm.incident.sla;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static com.itsm.support.TestFixtures.T0;
import static com.itsm.support.TestFixtures.p1Sla;
import static org.assertj.core.api.Assertions.assertThat;

/** SLA deadlines, status, and the "exactly once" warning/violation bookkeeping used by the monitor. */
class SlaTrackingTest {

    private SlaTracking sla;

    @BeforeEach
    void setUp() {
        sla = SlaTracking.start(p1Sla(), T0); // 5 min response, 30 min resolution
    }

    private static Instant at(int minutes, int seconds) {
        return T0.plus(Duration.ofMinutes(minutes)).plusSeconds(seconds);
    }

    @Test
    @DisplayName("Deadlines and the 75% AT_RISK points are calculated from the start time")
    void deadlines() {
        assertThat(sla.getResponseDueAt()).isEqualTo(at(5, 0));
        assertThat(sla.getResolutionDueAt()).isEqualTo(at(30, 0));
        assertThat(sla.getResponseAtRiskAt()).isEqualTo(at(3, 45));
        assertThat(sla.getResolutionAtRiskAt()).isEqualTo(at(22, 30));
    }

    @Test
    @DisplayName("Status goes ON_TRACK → AT_RISK → BREACHED as time passes")
    void statusOverTime() {
        assertThat(sla.statusAt(at(1, 0))).isEqualTo(SlaStatus.ON_TRACK);
        assertThat(sla.statusAt(at(4, 0))).isEqualTo(SlaStatus.AT_RISK);
        assertThat(sla.statusAt(at(5, 1))).isEqualTo(SlaStatus.BREACHED);
    }

    @Test
    @DisplayName("Resolving within the target is MET")
    void resolvedInTimeIsMet() {
        sla.recordResponse(at(2, 0));
        sla.recordResolution(at(20, 0));
        assertThat(sla.statusAt(at(60, 0))).isEqualTo(SlaStatus.MET);
    }

    @Test
    @DisplayName("Rule: once resolved, only the resolution target decides MET/BREACHED (a late response alone stays MET)")
    void lateResponseButResolvedInTime() {
        sla.recordResponse(at(6, 0));
        sla.recordResolution(at(20, 0));
        assertThat(sla.isResponseBreached()).isTrue();
        assertThat(sla.statusAt(at(60, 0))).isEqualTo(SlaStatus.MET);
    }

    @Test
    @DisplayName("Each warning is returned only once")
    void warningsOnlyOnce() {
        assertThat(sla.takeNewWarnings(at(3, 50))).containsExactly(SlaTarget.RESPONSE);
        assertThat(sla.takeNewWarnings(at(4, 30))).isEmpty();
        assertThat(sla.takeNewWarnings(at(23, 0))).containsExactly(SlaTarget.RESOLUTION);
    }

    @Test
    @DisplayName("No warning once the deadline has already passed (straight to breach)")
    void noLateWarning() {
        assertThat(sla.takeNewWarnings(at(6, 0))).isEmpty();
    }

    @Test
    @DisplayName("A missed deadline produces exactly one violation")
    void violationsOnlyOnce() {
        assertThat(sla.takeUnrecordedViolations(at(4, 0))).isEmpty();
        assertThat(sla.takeUnrecordedViolations(at(6, 0))).containsExactly(SlaTarget.RESPONSE);
        assertThat(sla.takeUnrecordedViolations(at(7, 0))).isEmpty();
        assertThat(sla.isResponseBreached()).isTrue();
    }

    @Test
    @DisplayName("A late acknowledgement is recorded as one violation too")
    void lateAcknowledgementIsAViolation() {
        sla.recordResponse(at(6, 0));
        assertThat(sla.takeUnrecordedViolations(at(6, 0))).containsExactly(SlaTarget.RESPONSE);
        assertThat(sla.takeUnrecordedViolations(at(8, 0))).isEmpty();
    }

    @Test
    @DisplayName("Reopening clears the resolution time")
    void reopenClearsResolution() {
        sla.recordResolution(at(20, 0));
        sla.reopen();
        assertThat(sla.getResolvedAt()).isNull();
    }
}
