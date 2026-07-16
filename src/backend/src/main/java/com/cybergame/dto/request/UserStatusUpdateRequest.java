package com.cybergame.dto.request;

import com.cybergame.entity.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Status is required")
        AccountStatus status
) {
}
