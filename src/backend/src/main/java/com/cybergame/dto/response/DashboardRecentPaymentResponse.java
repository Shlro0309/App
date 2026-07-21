package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DashboardRecentPaymentResponse(
        Integer id,
        Integer customerId,
        String customerName,
        String transactionType,
        BigDecimal amount,
        String paymentMethod,
        LocalDateTime transactionAt
) {
}
