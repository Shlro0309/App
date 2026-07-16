package com.cybergame.entity.converter;

import com.cybergame.entity.enums.OrderStatus;
import jakarta.persistence.Converter;

@Converter
public class OrderStatusConverter extends AbstractTinyIntEnumConverter<OrderStatus> {

    public OrderStatusConverter() {
        super(code -> OrderStatus.fromCode((short) code));
    }
}
