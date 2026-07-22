package com.cybergame.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UserBalanceUpdateRequest(
        @NotNull(message = "Balance is required")
        @DecimalMin(value = "0.00", message = "Balance must not be negative")
        @Digits(integer = 12, fraction = 2, message = "Balance format is invalid")
        BigDecimal balance
) {
}
