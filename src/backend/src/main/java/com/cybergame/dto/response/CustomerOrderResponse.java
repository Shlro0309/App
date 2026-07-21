package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerOrderResponse(
        Integer id,
        Integer customerId,
        Integer userId,
        String customerName,
        String phoneNumber,
        Integer playSessionId,
        Integer machineId,
        String machineName,
        Integer employeeId,
        String employeeName,
        LocalDateTime orderedAt,
        BigDecimal totalAmount,
        String status,
        List<OrderDetailResponse> items
) {
}
