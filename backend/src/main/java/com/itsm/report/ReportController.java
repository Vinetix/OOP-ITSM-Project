package com.itsm.report;

import com.itsm.report.dto.CategoryReportRow;
import com.itsm.report.dto.OverviewReport;
import com.itsm.report.dto.ServiceReportRow;
import com.itsm.report.dto.SlaReport;
import com.itsm.report.dto.TechnicianReportRow;
import com.itsm.report.dto.TrendPoint;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** ADMIN dashboards. from/to (YYYY-MM-DD, optional, "to" inclusive) filter by report date. */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Reports", description = "Dashboards and analytics (admin)")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/overview")
    @Operation(summary = "Totals, open/critical/escalated, SLA compliance, average response and resolution times, rating")
    public OverviewReport overview(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.overview(from, to);
    }

    @GetMapping("/technicians")
    @Operation(summary = "Per technician: active, resolved, average resolution time, SLA violations, rating")
    public List<TechnicianReportRow> technicians(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.technicians(from, to);
    }

    @GetMapping("/services")
    @Operation(summary = "Per service: incidents, open, critical (P1/P2), SLA violations, average resolution time")
    public List<ServiceReportRow> services(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.services(from, to);
    }

    @GetMapping("/categories")
    @Operation(summary = "Per category: incidents, open, average resolution time")
    public List<CategoryReportRow> categories(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.categories(from, to);
    }

    @GetMapping("/sla")
    @Operation(summary = "SLA compliance overall and per priority, violations by target")
    public SlaReport sla(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.sla(from, to);
    }

    @GetMapping("/trends")
    @Operation(summary = "Per day for the last N days (default 14, max 90): reported, resolved, SLA violations")
    public List<TrendPoint> trends(@RequestParam(name = "days", defaultValue = "14") int days) {
        return reportService.trends(days);
    }
}
