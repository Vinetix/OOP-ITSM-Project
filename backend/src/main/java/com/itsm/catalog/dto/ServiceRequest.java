package com.itsm.catalog.dto;

import com.itsm.catalog.BusinessCriticality;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ServiceRequest(
        @Schema(example = "Video Conferencing")
        @NotBlank @Size(max = 100) String name,

        @Schema(example = "Company-wide video meetings")
        @Size(max = 500) String description,

        @Schema(example = "HIGH")
        @NotNull BusinessCriticality criticality,

        @Schema(example = "8", description = "Optional id of the category incidents on this service usually belong to")
        Long defaultCategoryId
) {
}
