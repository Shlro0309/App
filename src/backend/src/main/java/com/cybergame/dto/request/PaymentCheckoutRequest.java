package com.cybergame.dto.request;

import jakarta.validation.constraints.Size;

public record PaymentCheckoutRequest(
        Integer customerId,
        Integer playSessionId,
        Integer orderId,

        @Size(max = 30, message = "Payment method must have at most 30 characters")
        String paymentMethod
) {
}
