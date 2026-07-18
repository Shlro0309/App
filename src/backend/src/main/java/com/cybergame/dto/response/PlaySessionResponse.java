package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PlaySessionResponse(
        Integer id,
        Integer customerId,
        Integer userId,
        String customerName,
        String phoneNumber,
        Integer machineId,
        String machineName,
        Integer areaId,
        String areaName,
        BigDecimal hourlyPrice,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        BigDecimal totalHourlyAmount,
        Long durationMinutes,
        String status
) {
}
