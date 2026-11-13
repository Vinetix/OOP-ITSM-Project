package com.itsm.incident.assignment;

import com.itsm.incident.assignment.dto.WorkloadResponse;
import com.itsm.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workload")
@RequiredArgsConstructor
@Tag(name = "Workload", description = "Active incidents per technician")
public class WorkloadController {

    private final TechnicianWorkloadService workloadService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: workload of every technician (alphabetical)")
    public List<WorkloadResponse> overview() {
        return workloadService.overview();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "TECHNICIAN: my current workload")
    public WorkloadResponse mine(@AuthenticationPrincipal UserPrincipal me) {
        return workloadService.forTechnician(me.getId());
    }
}
