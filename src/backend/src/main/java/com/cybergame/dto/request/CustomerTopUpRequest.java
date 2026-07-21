package com.cybergame.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CustomerTopUpRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1000.00", message = "Amount must be at least 1000")
        @Digits(integer = 10, fraction = 2, message = "Amount format is invalid")
        BigDecimal amount,

        @Size(max = 30, message = "Payment method must have at most 30 characters")
        String paymentMethod
) {
}
