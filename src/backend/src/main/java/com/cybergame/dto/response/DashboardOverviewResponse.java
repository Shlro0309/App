package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardOverviewResponse(
        LocalDateTime generatedAt,
        BigDecimal todayRevenue,
        BigDecimal weekRevenue,
        long paidInvoicesToday,
        long pendingInvoices,
        long activePlaySessions,
        long completedPlaySessionsToday,
        long todayReservations,
        long confirmedReservationsToday,
        long pendingOrders,
        long completedOrdersToday,
        long totalMachines,
        long availableMachines,
        long playingMachines,
        long maintenanceMachines,
        long activeServices,
        long lowStockServices,
        List<DashboardStatusCountResponse> machineStatuses,
        List<DashboardStatusCountResponse> reservationStatuses,
        List<DashboardStatusCountResponse> playSessionStatuses,
        List<DashboardStatusCountResponse> orderStatuses,
        List<DashboardStatusCountResponse> invoiceStatuses,
        List<DashboardRevenuePointResponse> revenueTrend,
        List<DashboardActiveSessionResponse> activeSessions,
        List<DashboardRecentPaymentResponse> recentPayments
) {
}
