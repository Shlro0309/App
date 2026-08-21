package com.cybergame.mapper;

import com.cybergame.dto.response.CustomerOrderResponse;
import com.cybergame.dto.response.OrderDetailResponse;
import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.OrderDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Mapper(componentModel = "spring")
public interface CustomerOrderMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "userId", source = "customer.user.id")
    @Mapping(target = "customerName", source = "customer.user.fullName")
    @Mapping(target = "phoneNumber", source = "customer.user.phoneNumber")
    @Mapping(target = "playSessionId", source = "playSession.id")
    @Mapping(target = "machineId", source = "playSession.machine.id")
    @Mapping(target = "machineName", source = "playSession.machine.name")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.user.fullName")
    @Mapping(target = "status", expression = "java(customerOrder.getStatus().name())")
    @Mapping(target = "items", expression = "java(toItemResponses(customerOrder))")
    CustomerOrderResponse toResponse(CustomerOrder customerOrder);

    @Mapping(target = "serviceId", source = "serviceItem.id")
    @Mapping(target = "serviceName", source = "serviceItem.name")
    @Mapping(target = "serviceType", source = "serviceItem.serviceType")
    @Mapping(target = "lineTotal", expression = "java(lineTotal(orderDetail))")
    OrderDetailResponse toItemResponse(OrderDetail orderDetail);

    default List<OrderDetailResponse> toItemResponses(CustomerOrder customerOrder) {
        return customerOrder.getOrderDetails()
                .stream()
                .sorted(Comparator.comparing(OrderDetail::getId))
                .map(this::toItemResponse)
                .toList();
    }

    default BigDecimal lineTotal(OrderDetail orderDetail) {
        if (orderDetail.getLineTotal() != null) {
            return orderDetail.getLineTotal();
        }
        if (orderDetail.getUnitPrice() == null || orderDetail.getQuantity() == null) {
            return BigDecimal.ZERO;
        }
        return orderDetail.getUnitPrice().multiply(BigDecimal.valueOf(orderDetail.getQuantity()));
    }
}
