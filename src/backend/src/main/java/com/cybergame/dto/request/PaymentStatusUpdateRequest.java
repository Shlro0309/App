package com.cybergame.dto.request;

import com.cybergame.entity.enums.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentStatusUpdateRequest(
        @NotNull(message = "Trạng thái là bắt buộc")
        InvoiceStatus status,

        @Size(max = 30, message = "Phương thức thanh toán không được vượt quá 30 ký tự")
        String paymentMethod
) {
}
