package com.cybergame.dto.request;

import com.cybergame.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record CustomerOrderStatusUpdateRequest(
        @NotNull(message = "Status is required")
        OrderStatus status
) {
}
