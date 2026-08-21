package com.cybergame.entity.converter;

import com.cybergame.entity.enums.MaintenanceStatus;
import jakarta.persistence.Converter;

@Converter
public class MaintenanceStatusConverter extends AbstractTinyIntEnumConverter<MaintenanceStatus> {

    public MaintenanceStatusConverter() {
        super(code -> MaintenanceStatus.fromCode((short) code));
    }
}
