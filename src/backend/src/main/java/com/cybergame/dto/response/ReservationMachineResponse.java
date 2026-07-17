package com.cybergame.dto.response;

import java.math.BigDecimal;

public record ReservationMachineResponse(
        Integer id,
        String name,
        Integer areaId,
        String areaName,
        BigDecimal hourlyPrice,
        String status
) {
}
