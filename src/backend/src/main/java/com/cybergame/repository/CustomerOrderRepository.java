package com.cybergame.repository;

import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Integer>, JpaSpecificationExecutor<CustomerOrder> {

    List<CustomerOrder> findByCustomerId(Integer customerId);

    List<CustomerOrder> findByStatus(OrderStatus status);

    long countByStatus(OrderStatus status);

    long countByOrderedAtGreaterThanEqualAndOrderedAtLessThan(LocalDateTime start, LocalDateTime end);

    long countByStatusAndOrderedAtGreaterThanEqualAndOrderedAtLessThan(
            OrderStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    @EntityGraph(attributePaths = {
            "customer",
            "customer.user",
            "playSession",
            "playSession.machine",
            "employee",
            "employee.user",
            "invoice",
            "orderDetails",
            "orderDetails.serviceItem"
    })
    @Query("select customerOrder from CustomerOrder customerOrder where customerOrder.id = :id")
    Optional<CustomerOrder> findDetailedById(@Param("id") Integer id);
}
