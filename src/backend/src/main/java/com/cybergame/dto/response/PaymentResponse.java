package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Integer id,
        Integer customerId,
        Integer userId,
        String customerName,
        String phoneNumber,
        Integer employeeId,
        String employeeName,
        Integer playSessionId,
        Integer machineId,
        String machineName,
        Integer orderId,
        String transactionType,
        BigDecimal playSessionAmount,
        BigDecimal orderAmount,
        BigDecimal amount,
        String paymentMethod,
        String status,
        LocalDateTime transactionAt
) {
}
