package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReportOverviewResponse(
        LocalDate fromDate,
        LocalDate toDate,
        LocalDateTime generatedAt,
        BigDecimal totalRevenue,
        BigDecimal playSessionRevenue,
        BigDecimal serviceRevenue,
        BigDecimal averageInvoiceAmount,
        long paidInvoiceCount,
        long completedPlaySessionCount,
        long completedOrderCount,
        long totalPlayMinutes,
        List<ReportRevenuePointResponse> revenueTrend,
        List<ReportBreakdownResponse> revenueByTransactionType,
        List<ReportBreakdownResponse> revenueByPaymentMethod,
        List<ReportMachineUsageResponse> machineUsage,
        List<ReportServiceSalesResponse> serviceSales,
        List<ReportTopCustomerResponse> topCustomers
) {
}
