package com.cybergame.dto.response;

import java.math.BigDecimal;

public record OrderDetailResponse(
        Integer id,
        Integer serviceId,
        String serviceName,
        String serviceType,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
