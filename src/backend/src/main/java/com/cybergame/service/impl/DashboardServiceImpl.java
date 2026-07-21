package com.cybergame.service.impl;

import com.cybergame.dto.response.DashboardActiveSessionResponse;
import com.cybergame.dto.response.DashboardOverviewResponse;
import com.cybergame.dto.response.DashboardRecentPaymentResponse;
import com.cybergame.dto.response.DashboardRevenuePointResponse;
import com.cybergame.dto.response.DashboardStatusCountResponse;
import com.cybergame.entity.Invoice;
import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.entity.enums.MachineStatus;
import com.cybergame.entity.enums.OrderStatus;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.entity.enums.ReservationStatus;
import com.cybergame.entity.enums.ServiceStatus;
import com.cybergame.repository.CustomerOrderRepository;
import com.cybergame.repository.InvoiceRepository;
import com.cybergame.repository.MachineRepository;
import com.cybergame.repository.PlaySessionRepository;
import com.cybergame.repository.ReservationRepository;
import com.cybergame.repository.ServiceItemRepository;
import com.cybergame.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int REVENUE_DAYS = 7;

    private final MachineRepository machineRepository;
    private final ReservationRepository reservationRepository;
    private final PlaySessionRepository playSessionRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final ServiceItemRepository serviceItemRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getOverview() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        LocalDateTime weekStart = today.minusDays(REVENUE_DAYS - 1L).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        BigDecimal todayRevenue = invoiceRepository.sumAmountByStatusAndTransactionAtBetween(
                InvoiceStatus.PAID,
                todayStart,
                tomorrowStart
        );
        BigDecimal weekRevenue = invoiceRepository.sumAmountByStatusAndTransactionAtBetween(
                InvoiceStatus.PAID,
                weekStart,
                tomorrowStart
        );

        return new DashboardOverviewResponse(
                now,
                todayRevenue,
                weekRevenue,
                invoiceRepository.countByStatusAndTransactionAtGreaterThanEqualAndTransactionAtLessThan(
                        InvoiceStatus.PAID,
                        todayStart,
                        tomorrowStart
                ),
                invoiceRepository.countByStatus(InvoiceStatus.PENDING),
                playSessionRepository.countByStatus(PlaySessionStatus.ACTIVE),
                playSessionRepository.countByStatusAndStartedAtGreaterThanEqualAndStartedAtLessThan(
                        PlaySessionStatus.COMPLETED,
                        todayStart,
                        tomorrowStart
                ),
                reservationRepository.countByReservedAtGreaterThanEqualAndReservedAtLessThan(todayStart, tomorrowStart),
                reservationRepository.countByStatusAndReservedAtGreaterThanEqualAndReservedAtLessThan(
                        ReservationStatus.CONFIRMED,
                        todayStart,
                        tomorrowStart
                ),
                customerOrderRepository.countByStatus(OrderStatus.PENDING),
                customerOrderRepository.countByStatusAndOrderedAtGreaterThanEqualAndOrderedAtLessThan(
                        OrderStatus.COMPLETED,
                        todayStart,
                        tomorrowStart
                ),
                machineRepository.count(),
                machineRepository.countByStatus(MachineStatus.AVAILABLE),
                machineRepository.countByStatus(MachineStatus.PLAYING),
                machineRepository.countByStatus(MachineStatus.MAINTENANCE),
                serviceItemRepository.countByStatus(ServiceStatus.ACTIVE),
                serviceItemRepository.countByStockQuantityLessThanEqual(LOW_STOCK_THRESHOLD),
                machineStatusCounts(),
                reservationStatusCounts(),
                playSessionStatusCounts(),
                orderStatusCounts(),
                invoiceStatusCounts(),
                revenueTrend(today),
                activeSessions(now),
                recentPayments()
        );
    }

    private List<DashboardStatusCountResponse> machineStatusCounts() {
        return Arrays.stream(MachineStatus.values())
                .map(status -> new DashboardStatusCountResponse(status.name(), machineRepository.countByStatus(status)))
                .toList();
    }

    private List<DashboardStatusCountResponse> reservationStatusCounts() {
        return Arrays.stream(ReservationStatus.values())
                .map(status -> new DashboardStatusCountResponse(status.name(), reservationRepository.countByStatus(status)))
                .toList();
    }

    private List<DashboardStatusCountResponse> playSessionStatusCounts() {
        return Arrays.stream(PlaySessionStatus.values())
                .map(status -> new DashboardStatusCountResponse(status.name(), playSessionRepository.countByStatus(status)))
                .toList();
    }

    private List<DashboardStatusCountResponse> orderStatusCounts() {
        return Arrays.stream(OrderStatus.values())
                .map(status -> new DashboardStatusCountResponse(status.name(), customerOrderRepository.countByStatus(status)))
                .toList();
    }

    private List<DashboardStatusCountResponse> invoiceStatusCounts() {
        return Arrays.stream(InvoiceStatus.values())
                .map(status -> new DashboardStatusCountResponse(status.name(), invoiceRepository.countByStatus(status)))
                .toList();
    }

    private List<DashboardRevenuePointResponse> revenueTrend(LocalDate today) {
        return today.minusDays(REVENUE_DAYS - 1L)
                .datesUntil(today.plusDays(1))
                .map(date -> {
                    LocalDateTime start = date.atStartOfDay();
                    LocalDateTime end = date.plusDays(1).atStartOfDay();
                    return new DashboardRevenuePointResponse(
                            date,
                            invoiceRepository.sumAmountByStatusAndTransactionAtBetween(InvoiceStatus.PAID, start, end),
                            invoiceRepository.countByStatusAndTransactionAtGreaterThanEqualAndTransactionAtLessThan(
                                    InvoiceStatus.PAID,
                                    start,
                                    end
                            )
                    );
                })
                .toList();
    }

    private List<DashboardActiveSessionResponse> activeSessions(LocalDateTime now) {
        return playSessionRepository.findTop6ByStatusOrderByStartedAtDesc(PlaySessionStatus.ACTIVE)
                .stream()
                .map(playSession -> toActiveSession(playSession, now))
                .toList();
    }

    private DashboardActiveSessionResponse toActiveSession(PlaySession playSession, LocalDateTime now) {
        return new DashboardActiveSessionResponse(
                playSession.getId(),
                playSession.getCustomer().getId(),
                playSession.getCustomer().getUser().getFullName(),
                playSession.getMachine().getId(),
                playSession.getMachine().getName(),
                playSession.getMachine().getArea().getName(),
                playSession.getStartedAt(),
                Math.max(0, Duration.between(playSession.getStartedAt(), now).toMinutes())
        );
    }

    private List<DashboardRecentPaymentResponse> recentPayments() {
        return invoiceRepository.findTop6ByStatusOrderByTransactionAtDesc(InvoiceStatus.PAID)
                .stream()
                .map(this::toRecentPayment)
                .toList();
    }

    private DashboardRecentPaymentResponse toRecentPayment(Invoice invoice) {
        return new DashboardRecentPaymentResponse(
                invoice.getId(),
                invoice.getCustomer().getId(),
                invoice.getCustomer().getUser().getFullName(),
                invoice.getTransactionType(),
                invoice.getAmount(),
                invoice.getPaymentMethod(),
                invoice.getTransactionAt()
        );
    }
}
