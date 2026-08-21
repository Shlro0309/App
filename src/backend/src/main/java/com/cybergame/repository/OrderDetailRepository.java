package com.cybergame.repository;

import com.cybergame.dto.response.ReportServiceSalesResponse;
import com.cybergame.entity.OrderDetail;
import com.cybergame.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

    List<OrderDetail> findByOrderId(Integer orderId);

    @Query("""
            select new com.cybergame.dto.response.ReportServiceSalesResponse(
                serviceItem.id,
                serviceItem.name,
                serviceItem.serviceType,
                coalesce(sum(orderDetail.quantity), 0),
                coalesce(sum(orderDetail.lineTotal), 0)
            )
            from OrderDetail orderDetail
            join orderDetail.serviceItem serviceItem
            join orderDetail.order customerOrder
            where customerOrder.status = :status
              and customerOrder.orderedAt >= :start
              and customerOrder.orderedAt < :end
            group by serviceItem.id, serviceItem.name, serviceItem.serviceType
            order by coalesce(sum(orderDetail.lineTotal), 0) desc
            """)
    List<ReportServiceSalesResponse> findServiceSales(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
