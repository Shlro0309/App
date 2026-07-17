package com.cybergame.dto.request;

import com.cybergame.entity.enums.ReservationStatus;
import jakarta.validation.constraints.NotNull;

public record ReservationStatusUpdateRequest(
        @NotNull(message = "Status is required")
        ReservationStatus status
) {
}
