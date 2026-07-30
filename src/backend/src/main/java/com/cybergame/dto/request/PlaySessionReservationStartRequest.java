package com.cybergame.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record PlaySessionReservationStartRequest(
        @NotNull(message = "Mã đặt máy là bắt buộc")
        Integer reservationId,

        @NotEmpty(message = "Cần chọn ít nhất một máy trạm")
        Set<@NotNull(message = "Mã máy trạm là bắt buộc") Integer> machineIds
) {
}
