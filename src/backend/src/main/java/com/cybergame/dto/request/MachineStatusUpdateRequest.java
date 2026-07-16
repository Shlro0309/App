package com.cybergame.dto.request;

import com.cybergame.entity.enums.MachineStatus;
import jakarta.validation.constraints.NotNull;

public record MachineStatusUpdateRequest(
        @NotNull(message = "Status is required")
        MachineStatus status
) {
}
