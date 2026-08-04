package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MachineResponse(
        Integer id,
        String name,
        Integer areaId,
        String areaName,
        String cpu,
        String gpu,
        Integer ram,
        Integer fps,
        String resolution,
        BigDecimal hourlyPrice,
        String status,
        Integer activePlaySessionId,
        String currentUsername,
        LocalDateTime addedAt
) {
}
