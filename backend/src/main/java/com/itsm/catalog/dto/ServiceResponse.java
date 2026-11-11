package com.itsm.catalog.dto;

import com.itsm.catalog.BusinessCriticality;
import com.itsm.catalog.ITService;

public record ServiceResponse(
        Long id,
        String name,
        String description,
        BusinessCriticality criticality,
        CategorySummary defaultCategory,
        boolean active
) {

    public static ServiceResponse from(ITService s) {
        return new ServiceResponse(s.getId(), s.getName(), s.getDescription(), s.getCriticality(),
                CategorySummary.from(s.getDefaultCategory()), s.isActive());
    }
}
