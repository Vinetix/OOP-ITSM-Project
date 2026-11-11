package com.itsm.catalog;

import com.itsm.catalog.dto.ServiceRequest;
import com.itsm.catalog.dto.ServiceResponse;
import com.itsm.security.UserPrincipal;
import com.itsm.user.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Tag(name = "Catalog: IT Services", description = "IT services with business criticality (read: all roles, manage: ADMIN)")
public class ITServiceController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    @Operation(summary = "List IT services (inactive ones only for ADMIN with includeInactive=true)")
    public List<ServiceResponse> list(@AuthenticationPrincipal UserPrincipal me,
                                      @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return serviceCatalogService.list(includeInactive && me.getRole() == Role.ADMIN);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one IT service")
    public ServiceResponse getById(@PathVariable("id") Long id) {
        return serviceCatalogService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ADMIN: add an IT service")
    public ServiceResponse create(@Valid @RequestBody ServiceRequest request) {
        return serviceCatalogService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: edit an IT service")
    public ServiceResponse update(@PathVariable("id") Long id, @Valid @RequestBody ServiceRequest request) {
        return serviceCatalogService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: activate an IT service")
    public ServiceResponse activate(@PathVariable("id") Long id) {
        return serviceCatalogService.setActive(id, true);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: deactivate an IT service (hidden from new incidents)")
    public ServiceResponse deactivate(@PathVariable("id") Long id) {
        return serviceCatalogService.setActive(id, false);
    }
}
