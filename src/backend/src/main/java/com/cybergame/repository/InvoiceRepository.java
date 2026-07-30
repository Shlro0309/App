package com.cybergame.repository;

import com.cybergame.dto.response.ReportBreakdownResponse;
import com.cybergame.dto.response.ReportTopCustomerResponse;
import com.cybergame.entity.Invoice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer>, JpaSpecificationExecutor<Invoice> {

    List<Invoice> findByCustomerId(Integer customerId);

    long countByStatus(com.cybergame.entity.enums.InvoiceStatus status);

    long countByStatusAndTransactionAtGreaterThanEqualAndTransactionAtLessThan(
            com.cybergame.entity.enums.InvoiceStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
            select coalesce(sum(invoice.amount), 0)
            from Invoice invoice
            where invoice.status = :status
              and invoice.transactionAt >= :start
              and invoice.transactionAt < :end
            """)
    BigDecimal sumAmountByStatusAndTransactionAtBetween(
            @Param("status") com.cybergame.entity.enums.InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            select coalesce(sum(playSession.totalHourlyAmount), 0)
            from Invoice invoice
            left join invoice.playSession playSession
            where invoice.status = :status
              and invoice.transactionAt >= :start
              and invoice.transactionAt < :end
            """)
    BigDecimal sumPlaySessionAmountByStatusAndTransactionAtBetween(
            @Param("status") com.cybergame.entity.enums.InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            select coalesce(sum(customerOrder.totalAmount), 0)
            from Invoice invoice
            left join invoice.order customerOrder
            where invoice.status = :status
              and invoice.transactionAt >= :start
              and invoice.transactionAt < :end
            """)
    BigDecimal sumOrderAmountByStatusAndTransactionAtBetween(
            @Param("status") com.cybergame.entity.enums.InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            select new com.cybergame.dto.response.ReportBreakdownResponse(
                invoice.transactionType,
                coalesce(sum(invoice.amount), 0),
                count(invoice)
            )
            from Invoice invoice
            where invoice.status = :status
              and invoice.transactionAt >= :start
              and invoice.transactionAt < :end
            group by invoice.transactionType
            order by coalesce(sum(invoice.amount), 0) desc
            """)
    List<ReportBreakdownResponse> findRevenueByTransactionType(
            @Param("status") com.cybergame.entity.enums.InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            select new com.cybergame.dto.response.ReportBreakdownResponse(
                coalesce(invoice.paymentMethod, 'UNKNOWN'),
                coalesce(sum(invoice.amount), 0),
                count(invoice)
            )
            from Invoice invoice
            where invoice.status = :status
              and invoice.transactionAt >= :start
              and invoice.transactionAt < :end
            group by coalesce(invoice.paymentMethod, 'UNKNOWN')
            order by coalesce(sum(invoice.amount), 0) desc
            """)
    List<ReportBreakdownResponse> findRevenueByPaymentMethod(
            @Param("status") com.cybergame.entity.enums.InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            select new com.cybergame.dto.response.ReportTopCustomerResponse(
                customer.id,
                customerUser.fullName,
                customerUser.phoneNumber,
                count(invoice),
                coalesce(sum(invoice.amount), 0)
            )
            from Invoice invoice
            join invoice.customer customer
            join customer.user customerUser
            where invoice.status = :status
              and invoice.transactionAt >= :start
              and invoice.transactionAt < :end
            group by customer.id, customerUser.fullName, customerUser.phoneNumber
            order by coalesce(sum(invoice.amount), 0) desc
            """)
    List<ReportTopCustomerResponse> findTopCustomersByRevenue(
            @Param("status") com.cybergame.entity.enums.InvoiceStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @EntityGraph(attributePaths = {
            "customer",
            "customer.user",
            "employee",
            "employee.user",
            "playSession",
            "playSession.machine",
            "order"
    })
    List<Invoice> findTop6ByStatusOrderByTransactionAtDesc(com.cybergame.entity.enums.InvoiceStatus status);

    @Query("""
            select count(invoice) > 0
            from Invoice invoice
            where invoice.order.id = :orderId
              and invoice.status <> com.cybergame.entity.enums.InvoiceStatus.CANCELLED
            """)
    boolean existsActiveOrderInvoice(@Param("orderId") Integer orderId);

    @Query("""
            select count(invoice) > 0
            from Invoice invoice
            where invoice.playSession.id = :playSessionId
              and invoice.status <> com.cybergame.entity.enums.InvoiceStatus.CANCELLED
            """)
    boolean existsActivePlaySessionInvoice(@Param("playSessionId") Integer playSessionId);

    @EntityGraph(attributePaths = {
            "customer",
            "customer.user",
            "employee",
            "employee.user",
            "playSession",
            "playSession.machine",
            "order",
            "order.orderDetails",
            "order.orderDetails.serviceItem"
    })
    @Query("select invoice from Invoice invoice where invoice.id = :id")
    Optional<Invoice> findDetailedById(@Param("id") Integer id);
}
