package com.cybergame.dto.request;

import jakarta.validation.constraints.NotNull;

public record PlaySessionStartRequest(
        Integer customerId,

        @NotNull(message = "Mã máy trạm là bắt buộc")
        Integer machineId
) {
}
