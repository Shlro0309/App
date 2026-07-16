package com.cybergame.entity.enums;

import java.util.Arrays;

public enum MachineStatus implements PersistableEnum {
    AVAILABLE(0),
    RESERVED(1),
    PLAYING(2),
    MAINTENANCE(3),
    OFFLINE(4);

    private final short code;

    MachineStatus(int code) {
        this.code = (short) code;
    }

    @Override
    public short getCode() {
        return code;
    }

    public static MachineStatus fromCode(short code) {
        return Arrays.stream(values())
                .filter(status -> status.code == code)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown machine status code: " + code));
    }
}
