package com.itsm.incident.assignment;

import com.itsm.incident.assignment.dto.AssignmentSettingsResponse;
import com.itsm.incident.assignment.dto.UpdateAssignmentSettingsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignment")
@RequiredArgsConstructor
@Tag(name = "Assignment", description = "Choose the technician assignment strategy and auto-assign behaviour")
public class AssignmentController {

    private final AssignmentSettingsService settingsService;

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: active strategy, auto-assign switch and all available strategies")
    public AssignmentSettingsResponse get() {
        return settingsService.get();
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: switch strategy and/or turn auto-assign on report on or off (null = unchanged)")
    public AssignmentSettingsResponse update(@Valid @RequestBody UpdateAssignmentSettingsRequest request) {
        return settingsService.update(request);
    }
}
