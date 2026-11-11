package com.itsm.catalog.dto;

import com.itsm.catalog.Category;

import java.util.List;

public record CategoryResponse(
        Long id,
        String code,
        String name,
        String description,
        List<String> keywords,
        boolean active
) {

    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getCode(), c.getName(), c.getDescription(),
                c.getKeywords().stream().sorted().toList(), c.isActive());
    }
}
