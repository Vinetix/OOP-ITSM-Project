package com.itsm.incident.sla;

import com.itsm.catalog.dto.EffectiveSla;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * The SLA clock of ONE incident, stored inside the incidents table (@Embeddable).
 *
 * Composition: it has no identity of its own and lives and dies with its incident.
 * It is a snapshot: targets are copied from the SLA policy when the incident is classified,
 * so later policy edits never move the deadlines of incidents that already exist.
 *
 * Phase 6: the SLA monitor uses the "warned" and "violation recorded" flags so that each warning and
 * each violation happens exactly once. @ColumnDefault lets Hibernate add these columns to a table
 * that already has rows.
 */
@Getter
@Embeddable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SlaTracking {

    /** At or above this fraction of elapsed time the SLA is AT_RISK. */
    public static final double AT_RISK_THRESHOLD = 0.75;

    @Column(length = 10)
    private String slaScope;

    private Long slaPolicyId;

    private int responseTargetMinutes;

    private int resolutionTargetMinutes;

    private Instant slaStartedAt;

    private Instant responseDueAt;

    private Instant resolutionDueAt;

    /** When the technician acknowledged the incident (first time only). */
    private Instant respondedAt;

    private Instant resolvedAt;

    private boolean responseBreached;

    private boolean resolutionBreached;

    @ColumnDefault("false")
    private boolean responseWarned;

    @ColumnDefault("false")
    private boolean resolutionWarned;

    @ColumnDefault("false")
    private boolean responseViolationRecorded;

    @ColumnDefault("false")
    private boolean resolutionViolationRecorded;

    public static SlaTracking start(EffectiveSla sla, Instant startedAt) {
        SlaTracking tracking = new SlaTracking();
        tracking.slaStartedAt = startedAt;
        tracking.applyTargets(sla);
        return tracking;
    }

    /** Priority or service changed: new targets, measured from the original start time. */
    public void retarget(EffectiveSla sla) {
        applyTargets(sla);
    }

    public void recordResponse(Instant at) {
        if (respondedAt == null) { // re-assignment doesn't reset the response clock
            respondedAt = at;
            responseBreached = at.isAfter(responseDueAt);
        }
    }

    public void recordResolution(Instant at) {
        resolvedAt = at;
        if (at.isAfter(resolutionDueAt)) {
            resolutionBreached = true;
        }
    }

    /** Fix rejected: the resolution clock runs again (a breach that already happened stays recorded). */
    public void reopen() {
        resolvedAt = null;
    }

    // ---------------- SLA monitor (Phase 6) ----------------

    /**
     * Targets that have just reached AT_RISK (75% of the time used, deadline not yet passed).
     * Each target is returned at most once.
     */
    public List<SlaTarget> takeNewWarnings(Instant now) {
        List<SlaTarget> due = new ArrayList<>();
        if (!responseWarned && respondedAt == null && !now.isAfter(responseDueAt)
                && elapsedFraction(responseDueAt, now) >= AT_RISK_THRESHOLD) {
            responseWarned = true;
            due.add(SlaTarget.RESPONSE);
        }
        if (!resolutionWarned && resolvedAt == null && !now.isAfter(resolutionDueAt)
                && elapsedFraction(resolutionDueAt, now) >= AT_RISK_THRESHOLD) {
            resolutionWarned = true;
            due.add(SlaTarget.RESOLUTION);
        }
        return due;
    }

    /**
     * Marks deadlines that have passed while still open as breached, then returns every breach
     * (found now, or earlier by a late acknowledge/resolve) that has no violation record yet,
     * and marks them recorded. The caller saves one SlaViolation per returned target.
     */
    public List<SlaTarget> takeUnrecordedViolations(Instant now) {
        if (respondedAt == null && now.isAfter(responseDueAt)) {
            responseBreached = true;
        }
        if (resolvedAt == null && now.isAfter(resolutionDueAt)) {
            resolutionBreached = true;
        }
        List<SlaTarget> unrecorded = new ArrayList<>();
        if (responseBreached && !responseViolationRecorded) {
            responseViolationRecorded = true;
            responseWarned = true; // no late warning after a breach
            unrecorded.add(SlaTarget.RESPONSE);
        }
        if (resolutionBreached && !resolutionViolationRecorded) {
            resolutionViolationRecorded = true;
            resolutionWarned = true;
            unrecorded.add(SlaTarget.RESOLUTION);
        }
        return unrecorded;
    }

    public int targetMinutes(SlaTarget target) {
        return target == SlaTarget.RESPONSE ? responseTargetMinutes : resolutionTargetMinutes;
    }

    public Instant dueAt(SlaTarget target) {
        return target == SlaTarget.RESPONSE ? responseDueAt : resolutionDueAt;
    }

    /** How far into the response target we are: 1.0 = deadline reached, 2.0 = twice the target. */
    public double responseElapsedFraction(Instant now) {
        return elapsedFraction(responseDueAt, now);
    }

    public SlaStatus statusAt(Instant now) {
        if (resolvedAt != null) {
            return resolutionBreached ? SlaStatus.BREACHED : SlaStatus.MET;
        }
        if (responseBreached || resolutionBreached
                || now.isAfter(resolutionDueAt)
                || (respondedAt == null && now.isAfter(responseDueAt))) {
            return SlaStatus.BREACHED;
        }
        boolean resolutionAtRisk = elapsedFraction(resolutionDueAt, now) >= AT_RISK_THRESHOLD;
        boolean responseAtRisk = respondedAt == null && elapsedFraction(responseDueAt, now) >= AT_RISK_THRESHOLD;
        return (resolutionAtRisk || responseAtRisk) ? SlaStatus.AT_RISK : SlaStatus.ON_TRACK;
    }

    private void applyTargets(EffectiveSla sla) {
        this.slaPolicyId = sla.policyId();
        this.slaScope = sla.scope();
        this.responseTargetMinutes = sla.responseMinutes();
        this.resolutionTargetMinutes = sla.resolutionMinutes();
        this.responseDueAt = slaStartedAt.plus(Duration.ofMinutes(responseTargetMinutes));
        this.resolutionDueAt = slaStartedAt.plus(Duration.ofMinutes(resolutionTargetMinutes));
        if (respondedAt != null) {
            this.responseBreached = respondedAt.isAfter(responseDueAt);
        }
        if (resolvedAt != null) {
            this.resolutionBreached = resolvedAt.isAfter(resolutionDueAt);
        }
    }

    private double elapsedFraction(Instant dueAt, Instant now) {
        long total = Duration.between(slaStartedAt, dueAt).toMillis();
        long used = Duration.between(slaStartedAt, now).toMillis();
        return total <= 0 ? 1.0 : (double) used / total;
    }
}
