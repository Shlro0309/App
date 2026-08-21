package com.cybergame.dto.request;

import com.cybergame.entity.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Trạng thái là bắt buộc")
        AccountStatus status
) {
}
