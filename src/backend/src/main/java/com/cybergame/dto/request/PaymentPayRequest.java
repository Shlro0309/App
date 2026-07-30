package com.cybergame.dto.request;

import jakarta.validation.constraints.Size;

public record PaymentPayRequest(
        @Size(max = 30, message = "Phương thức thanh toán không được vượt quá 30 ký tự")
        String paymentMethod
) {
}
