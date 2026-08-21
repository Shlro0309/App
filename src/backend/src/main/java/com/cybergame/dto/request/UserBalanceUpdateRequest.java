package com.cybergame.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UserBalanceUpdateRequest(
        @NotNull(message = "Số dư là bắt buộc")
        @DecimalMin(value = "0.00", message = "Số dư không được âm")
        @Digits(integer = 12, fraction = 2, message = "Định dạng số dư không hợp lệ")
        BigDecimal balance
) {
}
