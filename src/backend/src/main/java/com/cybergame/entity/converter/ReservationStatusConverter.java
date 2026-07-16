package com.cybergame.entity.converter;

import com.cybergame.entity.enums.ReservationStatus;
import jakarta.persistence.Converter;

@Converter
public class ReservationStatusConverter extends AbstractTinyIntEnumConverter<ReservationStatus> {

    public ReservationStatusConverter() {
        super(code -> ReservationStatus.fromCode((short) code));
    }
}
