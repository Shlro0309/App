package com.cybergame.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CustomerTopUpRequest(
        @NotNull(message = "Số tiền là bắt buộc")
        @DecimalMin(value = "1000.00", message = "Số tiền phải tối thiểu 1000")
        @Digits(integer = 10, fraction = 2, message = "Định dạng số tiền không hợp lệ")
        BigDecimal amount,

        @Size(max = 30, message = "Phương thức thanh toán không được vượt quá 30 ký tự")
        String paymentMethod
) {
}
