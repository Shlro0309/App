package com.cybergame.entity.converter;

import com.cybergame.entity.enums.PlaySessionStatus;
import jakarta.persistence.Converter;

@Converter
public class PlaySessionStatusConverter extends AbstractTinyIntEnumConverter<PlaySessionStatus> {

    public PlaySessionStatusConverter() {
        super(code -> PlaySessionStatus.fromCode((short) code));
    }
}
