package com.cybergame.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CustomerOrderCreateRequest(
        Integer customerId,
        Integer playSessionId,

        @Size(max = 30, message = "Phương thức thanh toán không được vượt quá 30 ký tự")
        String paymentMethod,

        @NotEmpty(message = "Cần chọn ít nhất một món")
        List<@Valid OrderItemRequest> items
) {
}
