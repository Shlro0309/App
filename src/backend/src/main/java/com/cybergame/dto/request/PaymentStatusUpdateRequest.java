package com.cybergame.dto.request;

import com.cybergame.entity.enums.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentStatusUpdateRequest(
        @NotNull(message = "Status is required")
        InvoiceStatus status,

        @Size(max = 30, message = "Payment method must have at most 30 characters")
        String paymentMethod
) {
}
