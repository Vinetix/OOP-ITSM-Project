package com.itsm.catalog.dto;

import com.itsm.catalog.Skill;

public record SkillResponse(
        Long id,
        String name,
        String description,
        CategorySummary category,
        boolean active
) {

    public static SkillResponse from(Skill s) {
        return new SkillResponse(s.getId(), s.getName(), s.getDescription(),
                CategorySummary.from(s.getCategory()), s.isActive());
    }
}
