package com.cybergame.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public record ReservationCreateRequest(
        Integer customerId,

        @NotNull(message = "Expiration time is required")
        @Future(message = "Expiration time must be in the future")
        LocalDateTime expiresAt,

        @DecimalMin(value = "0.00", message = "Deposit must be greater than or equal to 0")
        @Digits(integer = 8, fraction = 2, message = "Deposit must have up to 8 integer digits and 2 fraction digits")
        BigDecimal deposit,

        @NotEmpty(message = "At least one machine is required")
        Set<@NotNull(message = "Machine id is required") Integer> machineIds
) {
}
