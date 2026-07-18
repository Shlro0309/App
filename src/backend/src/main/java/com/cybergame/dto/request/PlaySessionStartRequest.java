package com.cybergame.dto.request;

import jakarta.validation.constraints.NotNull;

public record PlaySessionStartRequest(
        Integer customerId,

        @NotNull(message = "Machine id is required")
        Integer machineId
) {
}
