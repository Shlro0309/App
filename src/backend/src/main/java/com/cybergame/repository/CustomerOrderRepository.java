package com.cybergame.repository;

import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Integer> {

    List<CustomerOrder> findByCustomerId(Integer customerId);

    List<CustomerOrder> findByStatus(OrderStatus status);
}
