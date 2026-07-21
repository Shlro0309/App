package com.cybergame.dto.response;

import java.time.LocalDateTime;

public record DashboardActiveSessionResponse(
        Integer id,
        Integer customerId,
        String customerName,
        Integer machineId,
        String machineName,
        String areaName,
        LocalDateTime startedAt,
        long durationMinutes
) {
}
