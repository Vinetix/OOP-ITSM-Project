package com.itsm.catalog.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Create or update a category. code is only used on create (it cannot change afterwards). */
public record CategoryRequest(
        @Schema(example = "PRINTING", description = "Uppercase letters, digits, underscore. Ignored on update.")
        @NotBlank @Pattern(regexp = "^[A-Za-z][A-Za-z0-9_]{1,29}$",
                message = "must be 2-30 characters: letters, digits or underscore, starting with a letter") String code,

        @Schema(example = "Printing")
        @NotBlank @Size(max = 100) String name,

        @Schema(example = "Office printers, scanners and print queues")
        @Size(max = 500) String description,

        @Schema(example = "[\"printer\", \"print\", \"scanner\", \"toner\"]")
        @Size(max = 30) List<@NotBlank @Size(max = 50) String> keywords
) {
}
