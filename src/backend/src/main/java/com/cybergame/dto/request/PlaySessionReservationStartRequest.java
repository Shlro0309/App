package com.cybergame.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record PlaySessionReservationStartRequest(
        @NotNull(message = "Reservation id is required")
        Integer reservationId,

        @NotEmpty(message = "At least one machine is required")
        Set<@NotNull(message = "Machine id is required") Integer> machineIds
) {
}
