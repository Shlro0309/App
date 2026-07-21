package com.cybergame.repository;

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
            "order"
    })
    @Query("select invoice from Invoice invoice where invoice.id = :id")
    Optional<Invoice> findDetailedById(@Param("id") Integer id);
}
