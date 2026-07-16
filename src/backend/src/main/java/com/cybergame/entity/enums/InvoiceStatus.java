package com.cybergame.entity.enums;

import java.util.Arrays;

public enum InvoiceStatus implements PersistableEnum {
    PENDING(0),
    PAID(1),
    CANCELLED(2),
    REFUNDED(3);

    private final short code;

    InvoiceStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static InvoiceStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown invoice status code: " + code));
    }
}
