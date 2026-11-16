package com.itsm.report;

import com.itsm.common.exception.InvalidRequestException;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.state.IncidentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static com.itsm.support.TestFixtures.T0;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The shared definitions behind every report. */
class ReportRulesTest {

    private static IncidentFact fact(IncidentStatus status, Instant responded, Instant resolved,
                                     boolean responseBreached, boolean resolutionBreached) {
        return new IncidentFact(1L, status, Priority.P2, "NETWORK", "Network", "VPN", 2L, "Ravi Kumar",
                T0, responded, resolved, responseBreached, resolutionBreached, 0, 4);
    }

    @Test
    @DisplayName("Open = not RESOLVED/VERIFIED/CLOSED")
    void open() {
        assertThat(fact(IncidentStatus.AWAITING_INFO, T0, null, false, false).isOpen()).isTrue();
        assertThat(fact(IncidentStatus.VERIFIED, T0, T0, false, false).isOpen()).isFalse();
    }

    @Test
    @DisplayName("SLA outcome is known once resolved or already breached; compliant = no breach at all")
    void slaMeasurement() {
        assertThat(fact(IncidentStatus.IN_PROGRESS, T0, null, false, false).isSlaMeasured()).isFalse();
        assertThat(fact(IncidentStatus.IN_PROGRESS, null, null, true, false).isSlaMeasured()).isTrue();
        IncidentFact lateResponse = fact(IncidentStatus.CLOSED, T0, T0, true, false);
        assertThat(lateResponse.isSlaMeasured()).isTrue();
        assertThat(lateResponse.isBreached()).isTrue();
    }

    @Test
    @DisplayName("Response and resolution times in minutes")
    void durations() {
        IncidentFact f = fact(IncidentStatus.CLOSED, T0.plusSeconds(90), T0.plusSeconds(3600), false, false);
        assertThat(f.responseMinutes()).isEqualTo(1.5);
        assertThat(f.resolutionMinutes()).isEqualTo(60.0);
        assertThat(fact(IncidentStatus.ASSIGNED, null, null, false, false).responseMinutes()).isNull();
    }

    @Test
    @DisplayName("Report periods are whole days in India time, 'to' inclusive")
    void period() {
        ZoneId india = ZoneId.of("Asia/Kolkata");
        ReportPeriod period = ReportPeriod.of(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 10), india);
        assertThat(period.contains(Instant.parse("2026-11-09T18:30:00Z"))).isTrue();  // 00:00 IST on the 10th
        assertThat(period.contains(Instant.parse("2026-11-10T18:29:59Z"))).isTrue();  // 23:59:59 IST
        assertThat(period.contains(Instant.parse("2026-11-10T18:30:00Z"))).isFalse(); // the 11th
        assertThat(ReportPeriod.of(null, null, india).contains(T0)).isTrue();
    }

    @Test
    @DisplayName("'to' before 'from' is rejected")
    void invalidPeriod() {
        assertThatThrownBy(() -> ReportPeriod.of(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 1), ZoneId.of("UTC")))
                .isInstanceOf(InvalidRequestException.class);
    }
}
