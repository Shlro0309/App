package com.cybergame.dto.response;

import java.math.BigDecimal;

public record ReportMachineUsageResponse(
        Integer machineId,
        String machineName,
        String areaName,
        long sessionCount,
        long totalMinutes,
        BigDecimal revenue
) {
}
