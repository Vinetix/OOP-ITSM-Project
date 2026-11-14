package com.itsm.audit;

import com.itsm.audit.dto.AuditEntryResponse;
import com.itsm.common.web.PageResponse;
import com.itsm.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Incident history and admin audit search")
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/api/incidents/{id}/history")
    @Operation(summary = "Full history of one incident, oldest first (reporter, assigned technician, admin)")
    public List<AuditEntryResponse> history(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return auditService.history(id, me);
    }

    @GetMapping("/api/audit")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: search the audit log, newest first. Dates are YYYY-MM-DD (UTC, 'to' inclusive)")
    public PageResponse<AuditEntryResponse> search(
            @RequestParam(name = "incidentNumber", required = false) String incidentNumber,
            @RequestParam(name = "actorId", required = false) Long actorId,
            @RequestParam(name = "systemOnly", required = false) Boolean systemOnly,
            @RequestParam(name = "action", required = false) AuditAction action,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @ParameterObject @PageableDefault(size = 20, sort = "occurredAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return auditService.search(incidentNumber, actorId, systemOnly, action, from, to, pageable);
    }
}
