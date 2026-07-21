package com.cybergame.mapper;

import com.cybergame.dto.response.PaymentResponse;
import com.cybergame.entity.Invoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "userId", source = "customer.user.id")
    @Mapping(target = "customerName", source = "customer.user.fullName")
    @Mapping(target = "phoneNumber", source = "customer.user.phoneNumber")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.user.fullName")
    @Mapping(target = "playSessionId", source = "playSession.id")
    @Mapping(target = "machineId", source = "playSession.machine.id")
    @Mapping(target = "machineName", source = "playSession.machine.name")
    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "playSessionAmount", expression = "java(playSessionAmount(invoice))")
    @Mapping(target = "orderAmount", expression = "java(orderAmount(invoice))")
    @Mapping(target = "status", expression = "java(invoice.getStatus().name())")
    PaymentResponse toResponse(Invoice invoice);

    default BigDecimal playSessionAmount(Invoice invoice) {
        if (invoice.getPlaySession() == null || invoice.getPlaySession().getTotalHourlyAmount() == null) {
            return BigDecimal.ZERO;
        }
        return invoice.getPlaySession().getTotalHourlyAmount();
    }

    default BigDecimal orderAmount(Invoice invoice) {
        if (invoice.getOrder() == null || invoice.getOrder().getTotalAmount() == null) {
            return BigDecimal.ZERO;
        }
        return invoice.getOrder().getTotalAmount();
    }
}
