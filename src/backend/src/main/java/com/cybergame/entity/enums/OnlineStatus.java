package com.cybergame.entity.enums;

import java.util.Arrays;

public enum OnlineStatus implements PersistableEnum {
    OFFLINE(0),
    ONLINE(1);

    private final short code;

    OnlineStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static OnlineStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown online status code: " + code));
    }
}
