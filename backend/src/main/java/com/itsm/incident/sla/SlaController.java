package com.itsm.incident.sla;

import com.itsm.common.web.PageResponse;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.dto.SlaMonitorResult;
import com.itsm.incident.sla.dto.SlaViolationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sla")
@RequiredArgsConstructor
@Tag(name = "SLA", description = "SLA violations and the background SLA monitor")
public class SlaController {

    private final SlaService slaService;
    private final SlaMonitor slaMonitor;

    @GetMapping("/violations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: recorded SLA violations, newest first")
    public PageResponse<SlaViolationResponse> violations(
            @RequestParam(name = "target", required = false) SlaTarget target,
            @RequestParam(name = "priority", required = false) Priority priority,
            @RequestParam(name = "incidentNumber", required = false) String incidentNumber,
            @ParameterObject @PageableDefault(size = 20, sort = "detectedAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return slaService.violations(target, priority, incidentNumber, pageable);
    }

    @PostMapping("/monitor/run")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: run the SLA monitor now (it also runs every minute by itself)")
    public SlaMonitorResult runMonitor() {
        return slaMonitor.run();
    }
}
