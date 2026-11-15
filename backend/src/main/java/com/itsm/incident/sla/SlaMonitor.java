package com.itsm.incident.sla;

import com.itsm.incident.IncidentRepository;
import com.itsm.incident.sla.dto.SlaMonitorResult;
import com.itsm.incident.state.IncidentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Background SLA monitor: every minute it checks all incidents whose SLA clock is running (plus any
 * breach that still needs a violation record). Can be switched off with app.sla.monitor.enabled=false;
 * an admin can still trigger a run through POST /api/sla/monitor/run.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SlaMonitor {

    /** Statuses in which the SLA clock is running. */
    static final Set<IncidentStatus> CLOCK_RUNNING = EnumSet.of(IncidentStatus.CLASSIFIED, IncidentStatus.ASSIGNED,
            IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS, IncidentStatus.AWAITING_INFO);

    private final IncidentRepository incidentRepository;
    private final SlaCheckService checkService;
    private final Clock clock;

    @Value("${app.sla.monitor.enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${app.sla.monitor.interval-ms:60000}",
            initialDelayString = "${app.sla.monitor.initial-delay-ms:30000}")
    public void scheduledRun() {
        if (enabled) {
            SlaMonitorResult result = run();
            if (result.warnings() + result.breaches() + result.escalations() + result.failed() > 0) {
                log.info("SLA monitor: {}", result);
            }
        }
    }

    public SlaMonitorResult run() {
        Instant now = clock.instant();
        List<Long> ids = incidentRepository.findIdsForSlaCheck(CLOCK_RUNNING);
        int warnings = 0;
        int breaches = 0;
        int escalations = 0;
        int skipped = 0;
        int failed = 0;
        for (Long id : ids) {
            try {
                SlaCheckService.SlaCheckResult r = checkService.check(id, now);
                warnings += r.warnings();
                breaches += r.breaches();
                escalations += r.escalations();
            } catch (ObjectOptimisticLockingFailureException e) {
                skipped++; // someone changed it at the same moment; checked again next run
            } catch (RuntimeException e) {
                failed++;
                log.warn("SLA check of incident {} failed: {}", id, e.getMessage(), e);
            }
        }
        return new SlaMonitorResult(now, ids.size(), warnings, breaches, escalations, skipped, failed);
    }
}
