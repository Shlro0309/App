package com.cybergame.entity.enums;

import java.util.Arrays;

public enum ReservationStatus implements PersistableEnum {
    PENDING(0),
    CONFIRMED(1),
    CANCELLED(2),
    EXPIRED(3),
    COMPLETED(4);

    private final short code;

    ReservationStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static ReservationStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown reservation status code: " + code));
    }
}
