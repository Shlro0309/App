package com.cybergame.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
        @NotNull(message = "Service id is required")
        Integer serviceId,

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be greater than or equal to 1")
        Integer quantity
) {
}
