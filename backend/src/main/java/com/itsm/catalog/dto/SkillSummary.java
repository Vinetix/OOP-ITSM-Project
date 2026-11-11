package com.itsm.catalog.dto;

import com.itsm.catalog.Skill;

/** Compact skill reference embedded in technician profiles. */
public record SkillSummary(Long id, String name, String categoryCode) {

    public static SkillSummary from(Skill skill) {
        return new SkillSummary(skill.getId(), skill.getName(), skill.getCategory().getCode());
    }
}
