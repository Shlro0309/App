package com.cybergame.entity.enums;

import java.util.Arrays;

public enum PlaySessionStatus implements PersistableEnum {
    ACTIVE(0),
    COMPLETED(1),
    CANCELLED(2);

    private final short code;

    PlaySessionStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static PlaySessionStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown play session status code: " + code));
    }
}
