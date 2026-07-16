package com.cybergame.entity.enums;

import java.util.Arrays;

public enum OrderStatus implements PersistableEnum {
    PENDING(0),
    PREPARING(1),
    COMPLETED(2),
    CANCELLED(3);

    private final short code;

    OrderStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static OrderStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown order status code: " + code));
    }
}
