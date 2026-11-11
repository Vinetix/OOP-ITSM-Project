package com.itsm.catalog;

import com.itsm.catalog.dto.EffectiveSla;
import com.itsm.catalog.dto.SlaPolicyCreateRequest;
import com.itsm.catalog.dto.SlaPolicyResponse;
import com.itsm.catalog.dto.SlaPolicyUpdateRequest;
import com.itsm.incident.priority.Priority;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sla-policies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // every endpoint here is ADMIN-only
@Tag(name = "Catalog: SLA Policies", description = "Response/resolution targets per priority, with per-service overrides (ADMIN)")
public class SlaPolicyController {

    private final SlaPolicyService slaPolicyService;

    @GetMapping
    @Operation(summary = "List all SLA policies, or only one service's overrides with ?serviceId=")
    public List<SlaPolicyResponse> list(@RequestParam(name = "serviceId", required = false) Long serviceId) {
        return slaPolicyService.list(serviceId);
    }

    @GetMapping("/effective")
    @Operation(summary = "Preview which SLA applies to a service + priority (override, else default)")
    public EffectiveSla effective(@RequestParam(name = "serviceId", required = false) Long serviceId,
                                  @RequestParam(name = "priority") Priority priority) {
        return slaPolicyService.preview(serviceId, priority);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a default policy (serviceId null) or a service-specific override")
    public SlaPolicyResponse create(@Valid @RequestBody SlaPolicyCreateRequest request) {
        return slaPolicyService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Change response/resolution targets")
    public SlaPolicyResponse update(@PathVariable("id") Long id, @Valid @RequestBody SlaPolicyUpdateRequest request) {
        return slaPolicyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a service override (default policies cannot be deleted)")
    public void delete(@PathVariable("id") Long id) {
        slaPolicyService.delete(id);
    }
}
