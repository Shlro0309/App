package com.cybergame.entity.converter;

import com.cybergame.entity.enums.OnlineStatus;
import jakarta.persistence.Converter;

@Converter
public class OnlineStatusConverter extends AbstractTinyIntEnumConverter<OnlineStatus> {

    public OnlineStatusConverter() {
        super(code -> OnlineStatus.fromCode((short) code));
    }
}
