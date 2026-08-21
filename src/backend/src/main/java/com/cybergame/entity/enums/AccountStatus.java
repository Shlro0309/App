package com.cybergame.entity.enums;

import java.util.Arrays;

public enum AccountStatus implements PersistableEnum {
    LOCKED(0),
    ACTIVE(1);

    private final short code;

    AccountStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static AccountStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown account status code: " + code));
    }
}
