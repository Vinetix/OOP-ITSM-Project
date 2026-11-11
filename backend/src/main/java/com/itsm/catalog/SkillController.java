package com.itsm.catalog;

import com.itsm.catalog.dto.SkillRequest;
import com.itsm.catalog.dto.SkillResponse;
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
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Catalog: Skills", description = "Technician skills (read: all roles, manage: ADMIN)")
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    @Operation(summary = "List skills (inactive ones only for ADMIN with includeInactive=true)")
    public List<SkillResponse> list(@AuthenticationPrincipal UserPrincipal me,
                                    @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return skillService.list(includeInactive && me.getRole() == Role.ADMIN);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one skill")
    public SkillResponse getById(@PathVariable("id") Long id) {
        return skillService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ADMIN: create a skill linked to a category")
    public SkillResponse create(@Valid @RequestBody SkillRequest request) {
        return skillService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: edit a skill")
    public SkillResponse update(@PathVariable("id") Long id, @Valid @RequestBody SkillRequest request) {
        return skillService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: activate a skill")
    public SkillResponse activate(@PathVariable("id") Long id) {
        return skillService.setActive(id, true);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: deactivate a skill (ignored by skill-based assignment)")
    public SkillResponse deactivate(@PathVariable("id") Long id) {
        return skillService.setActive(id, false);
    }
}
