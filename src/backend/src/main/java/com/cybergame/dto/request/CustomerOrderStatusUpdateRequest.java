package com.cybergame.dto.request;

import com.cybergame.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record CustomerOrderStatusUpdateRequest(
        @NotNull(message = "Trạng thái là bắt buộc")
        OrderStatus status
) {
}
