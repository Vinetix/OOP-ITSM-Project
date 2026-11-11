package com.itsm.catalog.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SkillRequest(
        @Schema(example = "Kubernetes Operations")
        @NotBlank @Size(max = 100) String name,

        @Schema(example = "Running and troubleshooting Kubernetes clusters")
        @Size(max = 500) String description,

        @Schema(example = "5", description = "Id of the category this skill belongs to")
        @NotNull Long categoryId
) {
}
