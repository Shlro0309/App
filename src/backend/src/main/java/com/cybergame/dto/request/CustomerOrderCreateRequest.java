package com.cybergame.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CustomerOrderCreateRequest(
        Integer customerId,
        Integer playSessionId,

        @NotEmpty(message = "At least one order item is required")
        List<@Valid OrderItemRequest> items
) {
}
