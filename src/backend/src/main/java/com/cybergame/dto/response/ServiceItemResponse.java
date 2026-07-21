package com.cybergame.dto.response;

import java.math.BigDecimal;

public record ServiceItemResponse(
        Integer id,
        String name,
        BigDecimal price,
        String serviceType,
        String imageUrl,
        Integer stockQuantity,
        String status
) {
}
