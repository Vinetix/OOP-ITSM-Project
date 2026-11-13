package com.itsm.incident;

import com.itsm.common.web.PageResponse;
import com.itsm.incident.dto.AssignIncidentRequest;
import com.itsm.incident.dto.CloseIncidentRequest;
import com.itsm.incident.dto.CreateIncidentRequest;
import com.itsm.incident.dto.IncidentResponse;
import com.itsm.incident.dto.IncidentSummaryResponse;
import com.itsm.incident.dto.MessageRequest;
import com.itsm.incident.dto.ResolveIncidentRequest;
import com.itsm.incident.dto.UpdateIncidentRequest;
import com.itsm.incident.dto.VerifyIncidentRequest;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Each lifecycle step is its own endpoint (POST /api/incidents/{id}/acknowledge, ...).
 * @PreAuthorize does a coarse role check; IncidentService checks ownership (assigned technician,
 * reporter) and the incident's State checks whether the step is allowed right now.
 */
@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents", description = "Report, view, update and move incidents through their lifecycle")
public class IncidentController {

    private final IncidentService incidentService;

    // ---------------- report, view, edit ----------------

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Report an incident (auto-classified, prioritized and given an SLA)")
    public IncidentResponse report(@AuthenticationPrincipal UserPrincipal me,
                                   @Valid @RequestBody CreateIncidentRequest request) {
        return incidentService.report(request, me);
    }

    @GetMapping
    @Operation(summary = "List incidents visible to me (employee: reported, technician: assigned, admin: all)")
    public PageResponse<IncidentSummaryResponse> list(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestParam(name = "status", required = false) IncidentStatus status,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return incidentService.list(status, pageable, me);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Incident detail with notes, SLA and the actions I can take now")
    public IncidentResponse get(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return incidentService.get(id, me);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Reporter/ADMIN: edit details (null fields unchanged); priority and SLA are recalculated")
    public IncidentResponse update(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                   @Valid @RequestBody UpdateIncidentRequest request) {
        return incidentService.update(id, request, me);
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add a comment (reporter/admin) or work note (assigned technician)")
    public IncidentResponse addNote(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                    @Valid @RequestBody MessageRequest request) {
        return incidentService.addNote(id, request.message(), me);
    }

    // ---------------- lifecycle ----------------

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: assign or re-assign to a technician (checks availability and workload)")
    public IncidentResponse assign(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                   @Valid @RequestBody AssignIncidentRequest request) {
        return incidentService.assign(id, request.technicianId(), me);
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Assigned TECHNICIAN: acknowledge (records response time)")
    public IncidentResponse acknowledge(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return incidentService.acknowledge(id, me);
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Assigned TECHNICIAN: start investigating")
    public IncidentResponse start(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return incidentService.start(id, me);
    }

    @PostMapping("/{id}/request-info")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Assigned TECHNICIAN: ask the reporter for more information")
    public IncidentResponse requestInfo(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                        @Valid @RequestBody MessageRequest request) {
        return incidentService.requestInfo(id, request.message(), me);
    }

    @PostMapping("/{id}/provide-info")
    @Operation(summary = "Reporter: answer the technician's question")
    public IncidentResponse provideInfo(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                        @Valid @RequestBody MessageRequest request) {
        return incidentService.provideInfo(id, request.message(), me);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Assigned TECHNICIAN: provide the resolution")
    public IncidentResponse resolve(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                    @Valid @RequestBody ResolveIncidentRequest request) {
        return incidentService.resolve(id, request, me);
    }

    @PostMapping("/{id}/verify")
    @Operation(summary = "Reporter: confirm the fix works (optional rating 1-5 and feedback)")
    public IncidentResponse verify(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                   @Valid @RequestBody(required = false) VerifyIncidentRequest request) {
        return incidentService.verify(id, request == null ? new VerifyIncidentRequest(null, null) : request, me);
    }

    @PostMapping("/{id}/reopen")
    @Operation(summary = "Reporter: reject the resolution (back to IN_PROGRESS)")
    public IncidentResponse reopen(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                   @Valid @RequestBody MessageRequest request) {
        return incidentService.reopen(id, request.message(), me);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Operation(summary = "ADMIN or assigned TECHNICIAN: close a verified incident")
    public IncidentResponse close(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id,
                                  @Valid @RequestBody(required = false) CloseIncidentRequest request) {
        return incidentService.close(id, request == null ? null : request.closureNote(), me);
    }
}
