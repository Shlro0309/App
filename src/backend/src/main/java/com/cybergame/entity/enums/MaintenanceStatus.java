package com.cybergame.entity.enums;

import java.util.Arrays;

public enum MaintenanceStatus implements PersistableEnum {
    IN_PROGRESS(0),
    COMPLETED(1),
    CANCELLED(2);

    private final short code;

    MaintenanceStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static MaintenanceStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown maintenance status code: " + code));
    }
}
