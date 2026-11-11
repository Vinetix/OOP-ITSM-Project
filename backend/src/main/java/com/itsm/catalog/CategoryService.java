package com.itsm.catalog;

import com.itsm.catalog.dto.CategoryRequest;
import com.itsm.catalog.dto.CategoryResponse;
import com.itsm.common.exception.DuplicateResourceException;
import com.itsm.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(boolean includeInactive) {
        List<Category> categories = includeInactive
                ? categoryRepository.findAllByOrderByNameAsc()
                : categoryRepository.findAllByActiveTrueOrderByNameAsc();
        return categories.stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return CategoryResponse.from(find(id));
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByCodeIgnoreCase(request.code().trim())) {
            throw new DuplicateResourceException("A category with code " + request.code().trim().toUpperCase() + " already exists");
        }
        if (categoryRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new DuplicateResourceException("A category named '" + request.name().trim() + "' already exists");
        }
        Category saved = categoryRepository.save(
                new Category(request.code(), request.name(), request.description(), request.keywords()));
        return CategoryResponse.from(saved);
    }

    /** The code in the request is ignored: codes are permanent identifiers. */
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = find(id);
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new DuplicateResourceException("A category named '" + request.name().trim() + "' already exists");
        }
        category.updateDetails(request.name(), request.description());
        category.replaceKeywords(request.keywords());
        return CategoryResponse.from(category);
    }

    public CategoryResponse setActive(Long id, boolean active) {
        Category category = find(id);
        if (active) {
            category.activate();
        } else {
            category.deactivate();
        }
        return CategoryResponse.from(category);
    }

    /** Used by other services (ITService, Skill, later Incident) to resolve an id into an entity. */
    @Transactional(readOnly = true)
    public Category find(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }
}
