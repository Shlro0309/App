package com.cybergame.entity.enums;

import java.util.Arrays;

public enum PromotionStatus implements PersistableEnum {
    INACTIVE(0),
    ACTIVE(1);

    private final short code;

    PromotionStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static PromotionStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown promotion status code: " + code));
    }
}
