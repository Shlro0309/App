package com.cybergame.entity.converter;

import com.cybergame.entity.enums.ServiceStatus;
import jakarta.persistence.Converter;

@Converter
public class ServiceStatusConverter extends AbstractTinyIntEnumConverter<ServiceStatus> {

    public ServiceStatusConverter() {
        super(code -> ServiceStatus.fromCode((short) code));
    }
}
