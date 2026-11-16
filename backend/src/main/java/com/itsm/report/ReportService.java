package com.itsm.report;

import com.itsm.common.exception.InvalidRequestException;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.SlaTarget;
import com.itsm.incident.sla.SlaViolation;
import com.itsm.incident.sla.SlaViolationRepository;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.report.dto.CategoryReportRow;
import com.itsm.report.dto.OverviewReport;
import com.itsm.report.dto.ServiceReportRow;
import com.itsm.report.dto.SlaReport;
import com.itsm.report.dto.TechnicianReportRow;
import com.itsm.report.dto.TrendPoint;
import com.itsm.user.Technician;
import com.itsm.user.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Dashboard numbers. Incidents are selected by report date (from/to, reports time zone, "to" inclusive);
 * SLA violations by the date they were recorded. Every figure is derived from IncidentFact so all
 * reports share one set of definitions.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReportService {

    static final int MAX_TREND_DAYS = 90;

    private final ReportQueries queries;
    private final SlaViolationRepository violationRepository;
    private final TechnicianRepository technicianRepository;
    private final Clock clock;

    @Value("${app.reports.zone:Asia/Kolkata}")
    private String zoneName;

    public OverviewReport overview(LocalDate from, LocalDate to) {
        ReportPeriod period = period(from, to);
        List<IncidentFact> facts = facts(period);
        List<SlaViolation> violations = violations(period);
        Map<IncidentStatus, Long> byStatus = new EnumMap<>(IncidentStatus.class);
        Map<Priority, Long> byPriority = new EnumMap<>(Priority.class);
        for (IncidentFact f : facts) {
            byStatus.merge(f.status(), 1L, Long::sum);
            if (f.priority() != null) {
                byPriority.merge(f.priority(), 1L, Long::sum);
            }
        }
        return new OverviewReport(from, to,
                facts.size(),
                count(facts, IncidentFact::isOpen),
                count(facts, f -> f.isOpen() && f.priority() == Priority.P1),
                count(facts, IncidentFact::isResolved),
                count(facts, f -> f.isOpen() && f.escalationLevel() > 0),
                violations.size(),
                compliance(facts),
                average(facts, IncidentFact::responseMinutes),
                average(facts, IncidentFact::resolutionMinutes),
                averageRating(facts),
                byStatus, byPriority);
    }

    public List<TechnicianReportRow> technicians(LocalDate from, LocalDate to) {
        ReportPeriod period = period(from, to);
        List<IncidentFact> facts = facts(period);
        Map<Long, Long> violationsByTechnician = violations(period).stream()
                .filter(v -> v.getTechnicianId() != null)
                .collect(Collectors.groupingBy(SlaViolation::getTechnicianId, Collectors.counting()));
        List<TechnicianReportRow> rows = new ArrayList<>();
        for (Technician t : technicianRepository.findAllByOrderByFullNameAsc()) {
            List<IncidentFact> mine = facts.stream().filter(f -> t.getId().equals(f.technicianId())).toList();
            rows.add(new TechnicianReportRow(t.getId(), t.getFullName(), t.isSenior(), t.isAvailable(),
                    count(mine, f -> IncidentStatus.ACTIVE_WORK.contains(f.status())),
                    t.getMaxActiveIncidents(),
                    count(mine, IncidentFact::isResolved),
                    average(mine, IncidentFact::resolutionMinutes),
                    violationsByTechnician.getOrDefault(t.getId(), 0L),
                    averageRating(mine)));
        }
        return rows;
    }

    public List<ServiceReportRow> services(LocalDate from, LocalDate to) {
        ReportPeriod period = period(from, to);
        Map<String, Long> violationsByService = violations(period).stream()
                .collect(Collectors.groupingBy(SlaViolation::getServiceName, Collectors.counting()));
        return groupBy(facts(period), IncidentFact::serviceName).entrySet().stream()
                .map(e -> new ServiceReportRow(e.getKey(), e.getValue().size(),
                        count(e.getValue(), IncidentFact::isOpen),
                        count(e.getValue(), f -> f.priority() == Priority.P1 || f.priority() == Priority.P2),
                        violationsByService.getOrDefault(e.getKey(), 0L),
                        average(e.getValue(), IncidentFact::resolutionMinutes)))
                .sorted(Comparator.comparingLong(ServiceReportRow::totalIncidents).reversed()
                        .thenComparing(ServiceReportRow::serviceName))
                .toList();
    }

    public List<CategoryReportRow> categories(LocalDate from, LocalDate to) {
        List<IncidentFact> facts = facts(period(from, to)).stream().filter(f -> f.categoryCode() != null).toList();
        return groupBy(facts, IncidentFact::categoryCode).entrySet().stream()
                .map(e -> new CategoryReportRow(e.getKey(), e.getValue().get(0).categoryName(), e.getValue().size(),
                        count(e.getValue(), IncidentFact::isOpen),
                        average(e.getValue(), IncidentFact::resolutionMinutes)))
                .sorted(Comparator.comparingLong(CategoryReportRow::totalIncidents).reversed()
                        .thenComparing(CategoryReportRow::code))
                .toList();
    }

    public SlaReport sla(LocalDate from, LocalDate to) {
        ReportPeriod period = period(from, to);
        List<IncidentFact> facts = facts(period);
        List<SlaViolation> violations = violations(period);
        List<SlaReport.PriorityRow> rows = new ArrayList<>();
        for (Priority p : Priority.values()) {
            List<IncidentFact> ofPriority = facts.stream().filter(f -> f.priority() == p).toList();
            List<SlaViolation> violationsOfPriority = violations.stream().filter(v -> v.getPriority() == p).toList();
            rows.add(new SlaReport.PriorityRow(p,
                    count(ofPriority, IncidentFact::isSlaMeasured),
                    count(ofPriority, f -> f.isSlaMeasured() && !f.isBreached()),
                    count(ofPriority, IncidentFact::isBreached),
                    compliance(ofPriority),
                    count(violationsOfPriority, v -> v.getTarget() == SlaTarget.RESPONSE),
                    count(violationsOfPriority, v -> v.getTarget() == SlaTarget.RESOLUTION)));
        }
        return new SlaReport(compliance(facts),
                count(facts, IncidentFact::isSlaMeasured),
                count(facts, f -> f.isSlaMeasured() && !f.isBreached()),
                count(facts, IncidentFact::isBreached),
                count(violations, v -> v.getTarget() == SlaTarget.RESPONSE),
                count(violations, v -> v.getTarget() == SlaTarget.RESOLUTION),
                rows);
    }

    /** The last {days} days including today, oldest first, with zero-filled days. */
    public List<TrendPoint> trends(int days) {
        if (days < 1 || days > MAX_TREND_DAYS) {
            throw new InvalidRequestException("days must be between 1 and " + MAX_TREND_DAYS);
        }
        ZoneId zone = zone();
        LocalDate today = LocalDate.ofInstant(clock.instant(), zone);
        LocalDate first = today.minusDays(days - 1L);
        ReportPeriod period = ReportPeriod.of(first, today, zone);
        Map<LocalDate, long[]> perDay = new LinkedHashMap<>();
        for (LocalDate d = first; !d.isAfter(today); d = d.plusDays(1)) {
            perDay.put(d, new long[3]);
        }
        for (IncidentFact f : queries.incidentFacts(period.start(), period.end())) {
            perDay.get(LocalDate.ofInstant(f.reportedAt(), zone))[0]++;
        }
        // resolved in the window, whenever they were reported
        for (IncidentFact f : queries.incidentFacts(null, period.end())) {
            if (period.contains(f.resolvedAt())) {
                perDay.get(LocalDate.ofInstant(f.resolvedAt(), zone))[1]++;
            }
        }
        for (SlaViolation v : violations(period)) {
            perDay.get(LocalDate.ofInstant(v.getDetectedAt(), zone))[2]++;
        }
        return perDay.entrySet().stream()
                .map(e -> new TrendPoint(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();
    }

    // ---------------- helpers ----------------

    private ZoneId zone() {
        return ZoneId.of(zoneName);
    }

    private ReportPeriod period(LocalDate from, LocalDate to) {
        return ReportPeriod.of(from, to, zone());
    }

    private List<IncidentFact> facts(ReportPeriod period) {
        return queries.incidentFacts(period.start(), period.end());
    }

    private List<SlaViolation> violations(ReportPeriod period) {
        return violationRepository.findAll().stream().filter(v -> period.contains(v.getDetectedAt())).toList();
    }

    private static <T> long count(List<T> items, Predicate<T> condition) {
        return items.stream().filter(condition).count();
    }

    private static Double average(List<IncidentFact> facts, Function<IncidentFact, Double> value) {
        return round(facts.stream().map(value).filter(Objects::nonNull).mapToDouble(Double::doubleValue).average());
    }

    private static Double averageRating(List<IncidentFact> facts) {
        return round(facts.stream().map(IncidentFact::feedbackRating).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average());
    }

    private static Double compliance(List<IncidentFact> facts) {
        long measured = count(facts, IncidentFact::isSlaMeasured);
        if (measured == 0) {
            return null;
        }
        long met = count(facts, f -> f.isSlaMeasured() && !f.isBreached());
        return Math.round(1000.0 * met / measured) / 10.0;
    }

    private static Double round(java.util.OptionalDouble value) {
        return value.isPresent() ? Math.round(value.getAsDouble() * 10) / 10.0 : null;
    }

    private static Map<String, List<IncidentFact>> groupBy(List<IncidentFact> facts, Function<IncidentFact, String> key) {
        return facts.stream().collect(Collectors.groupingBy(key, LinkedHashMap::new, Collectors.toList()));
    }
}
