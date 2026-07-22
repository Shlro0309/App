package com.cybergame.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaUpsertRequest(
        @NotBlank(message = "Area name is required")
        @Size(max = 50, message = "Area name must not exceed 50 characters")
        String name,

        @Size(max = 255, message = "Area description must not exceed 255 characters")
        String description
) {
}
