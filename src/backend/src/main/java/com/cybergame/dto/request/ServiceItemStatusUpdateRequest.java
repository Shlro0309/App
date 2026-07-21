package com.cybergame.dto.request;

import com.cybergame.entity.enums.ServiceStatus;
import jakarta.validation.constraints.NotNull;

public record ServiceItemStatusUpdateRequest(
        @NotNull(message = "Status is required")
        ServiceStatus status
) {
}
