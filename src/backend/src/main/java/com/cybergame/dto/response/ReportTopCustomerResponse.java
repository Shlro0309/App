package com.cybergame.dto.response;

import java.math.BigDecimal;

public record ReportTopCustomerResponse(
        Integer customerId,
        String customerName,
        String phoneNumber,
        long paidInvoiceCount,
        BigDecimal revenue
) {
}
