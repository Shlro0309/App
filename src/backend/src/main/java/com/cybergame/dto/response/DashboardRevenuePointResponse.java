package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardRevenuePointResponse(
        LocalDate date,
        BigDecimal revenue,
        long paidInvoiceCount
) {
}
