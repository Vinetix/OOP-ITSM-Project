package com.itsm.catalog.dto;

import com.itsm.catalog.Category;

/** Compact category reference embedded in other responses (services, skills, incidents). */
public record CategorySummary(Long id, String code, String name) {

    public static CategorySummary from(Category category) {
        return category == null ? null : new CategorySummary(category.getId(), category.getCode(), category.getName());
    }
}
