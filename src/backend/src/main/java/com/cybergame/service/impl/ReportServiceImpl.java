package com.cybergame.service.impl;

import com.cybergame.dto.response.ReportMachineUsageResponse;
import com.cybergame.dto.response.ReportOverviewResponse;
import com.cybergame.dto.response.ReportRevenuePointResponse;
import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.entity.enums.OrderStatus;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.repository.CustomerOrderRepository;
import com.cybergame.repository.InvoiceRepository;
import com.cybergame.repository.OrderDetailRepository;
import com.cybergame.repository.PlaySessionRepository;
import com.cybergame.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final int DEFAULT_REPORT_DAYS = 30;
    private static final int MAX_REPORT_DAYS = 366;
    private static final int TOP_LIMIT = 10;

    private final InvoiceRepository invoiceRepository;
    private final PlaySessionRepository playSessionRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final OrderDetailRepository orderDetailRepository;

    @Override
    @Transactional(readOnly = true)
    public ReportOverviewResponse getOverview(LocalDate fromDate, LocalDate toDate) {
        ReportRange range = normalizeRange(fromDate, toDate);
        LocalDateTime start = range.fromDate().atStartOfDay();
        LocalDateTime end = range.toDate().plusDays(1).atStartOfDay();

        BigDecimal totalRevenue = invoiceRepository.sumAmountByStatusAndTransactionAtBetween(
                InvoiceStatus.PAID,
                start,
                end
        );
        long paidInvoiceCount = invoiceRepository.countByStatusAndTransactionAtGreaterThanEqualAndTransactionAtLessThan(
                InvoiceStatus.PAID,
                start,
                end
        );
        BigDecimal averageInvoiceAmount = paidInvoiceCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(paidInvoiceCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        List<PlaySession> completedSessions = playSessionRepository.findDetailedByStatusAndStartedAtBetween(
                PlaySessionStatus.COMPLETED,
                start,
                end
        );

        return new ReportOverviewResponse(
                range.fromDate(),
                range.toDate(),
                LocalDateTime.now(),
                totalRevenue,
                invoiceRepository.sumPlaySessionAmountByStatusAndTransactionAtBetween(InvoiceStatus.PAID, start, end),
                invoiceRepository.sumOrderAmountByStatusAndTransactionAtBetween(InvoiceStatus.PAID, start, end),
                averageInvoiceAmount,
                paidInvoiceCount,
                completedSessions.size(),
                customerOrderRepository.countByStatusAndOrderedAtGreaterThanEqualAndOrderedAtLessThan(
                        OrderStatus.COMPLETED,
                        start,
                        end
                ),
                totalPlayMinutes(completedSessions),
                revenueTrend(range),
                invoiceRepository.findRevenueByTransactionType(InvoiceStatus.PAID, start, end)
                        .stream()
                        .limit(TOP_LIMIT)
                        .toList(),
                invoiceRepository.findRevenueByPaymentMethod(InvoiceStatus.PAID, start, end)
                        .stream()
                        .limit(TOP_LIMIT)
                        .toList(),
                machineUsage(completedSessions),
                orderDetailRepository.findServiceSales(OrderStatus.COMPLETED, start, end)
                        .stream()
                        .limit(TOP_LIMIT)
                        .toList(),
                invoiceRepository.findTopCustomersByRevenue(InvoiceStatus.PAID, start, end)
                        .stream()
                        .limit(TOP_LIMIT)
                        .toList()
        );
    }

    private ReportRange normalizeRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate effectiveToDate = toDate != null ? toDate : LocalDate.now();
        LocalDate effectiveFromDate = fromDate != null
                ? fromDate
                : effectiveToDate.minusDays(DEFAULT_REPORT_DAYS - 1L);

        if (effectiveFromDate.isAfter(effectiveToDate)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "fromDate must be before or equal to toDate");
        }

        long days = Duration.between(effectiveFromDate.atStartOfDay(), effectiveToDate.plusDays(1).atStartOfDay())
                .toDays();
        if (days > MAX_REPORT_DAYS) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Report range must not exceed 366 days");
        }

        return new ReportRange(effectiveFromDate, effectiveToDate);
    }

    private List<ReportRevenuePointResponse> revenueTrend(ReportRange range) {
        return range.fromDate()
                .datesUntil(range.toDate().plusDays(1))
                .map(date -> {
                    LocalDateTime start = date.atStartOfDay();
                    LocalDateTime end = date.plusDays(1).atStartOfDay();
                    return new ReportRevenuePointResponse(
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

    private List<ReportMachineUsageResponse> machineUsage(List<PlaySession> completedSessions) {
        Map<Integer, MachineUsageAccumulator> usageByMachine = new LinkedHashMap<>();
        completedSessions.forEach(playSession -> {
            Integer machineId = playSession.getMachine().getId();
            MachineUsageAccumulator usage = usageByMachine.computeIfAbsent(
                    machineId,
                    id -> new MachineUsageAccumulator(
                            id,
                            playSession.getMachine().getName(),
                            playSession.getMachine().getArea().getName()
                    )
            );
            usage.add(playSessionDurationMinutes(playSession), playSession.getTotalHourlyAmount());
        });

        return usageByMachine.values()
                .stream()
                .map(MachineUsageAccumulator::toResponse)
                .sorted(Comparator.comparing(ReportMachineUsageResponse::revenue).reversed())
                .limit(TOP_LIMIT)
                .toList();
    }

    private long totalPlayMinutes(List<PlaySession> completedSessions) {
        return completedSessions.stream()
                .mapToLong(this::playSessionDurationMinutes)
                .sum();
    }

    private long playSessionDurationMinutes(PlaySession playSession) {
        if (playSession.getEndedAt() == null || playSession.getEndedAt().isBefore(playSession.getStartedAt())) {
            return 0;
        }
        return Duration.between(playSession.getStartedAt(), playSession.getEndedAt()).toMinutes();
    }

    private record ReportRange(LocalDate fromDate, LocalDate toDate) {
    }

    private static class MachineUsageAccumulator {

        private final Integer machineId;
        private final String machineName;
        private final String areaName;
        private long sessionCount;
        private long totalMinutes;
        private BigDecimal revenue = BigDecimal.ZERO;

        private MachineUsageAccumulator(Integer machineId, String machineName, String areaName) {
            this.machineId = machineId;
            this.machineName = machineName;
            this.areaName = areaName;
        }

        private void add(long minutes, BigDecimal sessionRevenue) {
            sessionCount++;
            totalMinutes += minutes;
            if (sessionRevenue != null) {
                revenue = revenue.add(sessionRevenue);
            }
        }

        private ReportMachineUsageResponse toResponse() {
            return new ReportMachineUsageResponse(
                    machineId,
                    machineName,
                    areaName,
                    sessionCount,
                    totalMinutes,
                    revenue
            );
        }
    }
}
