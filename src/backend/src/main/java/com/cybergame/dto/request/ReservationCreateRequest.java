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

        @NotNull(message = "Thời gian hết hạn là bắt buộc")
        @Future(message = "Thời gian hết hạn phải ở tương lai")
        LocalDateTime expiresAt,

        @DecimalMin(value = "0.00", message = "Tiền đặt cọc phải lớn hơn hoặc bằng 0")
        @Digits(integer = 8, fraction = 2, message = "Tiền đặt cọc chỉ được có tối đa 8 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal deposit,

        @NotEmpty(message = "Cần chọn ít nhất một máy trạm")
        Set<@NotNull(message = "Mã máy trạm là bắt buộc") Integer> machineIds
) {
}
