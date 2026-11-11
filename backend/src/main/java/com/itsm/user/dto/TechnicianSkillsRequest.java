package com.itsm.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** The complete new skill list for a technician. Empty set = remove all skills. */
public record TechnicianSkillsRequest(
        @Schema(example = "[1, 4, 6]")
        @NotNull @Size(max = 30) Set<@NotNull Long> skillIds
) {
}
