package com.cybergame.entity.converter;

import com.cybergame.entity.enums.MachineStatus;
import jakarta.persistence.Converter;

@Converter
public class MachineStatusConverter extends AbstractTinyIntEnumConverter<MachineStatus> {

    public MachineStatusConverter() {
        super(code -> MachineStatus.fromCode((short) code));
    }
}
