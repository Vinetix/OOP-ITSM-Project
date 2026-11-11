package com.itsm.catalog;

import com.itsm.catalog.dto.CategoryRequest;
import com.itsm.catalog.dto.CategoryResponse;
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
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Catalog: Categories", description = "Incident categories (read: all roles, manage: ADMIN)")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List categories (inactive ones only for ADMIN with includeInactive=true)")
    public List<CategoryResponse> list(@AuthenticationPrincipal UserPrincipal me,
                                       @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return categoryService.list(includeInactive && me.getRole() == Role.ADMIN);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one category")
    public CategoryResponse getById(@PathVariable("id") Long id) {
        return categoryService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "ADMIN: create a category (no code changes needed for new categories)")
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: edit name, description, keywords (code cannot change)")
    public CategoryResponse update(@PathVariable("id") Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: activate a category")
    public CategoryResponse activate(@PathVariable("id") Long id) {
        return categoryService.setActive(id, true);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "ADMIN: deactivate a category (hidden from new incidents)")
    public CategoryResponse deactivate(@PathVariable("id") Long id) {
        return categoryService.setActive(id, false);
    }
}
