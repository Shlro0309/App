package com.cybergame.entity.converter;

import com.cybergame.entity.enums.InvoiceStatus;
import jakarta.persistence.Converter;

@Converter
public class InvoiceStatusConverter extends AbstractTinyIntEnumConverter<InvoiceStatus> {

    public InvoiceStatusConverter() {
        super(code -> InvoiceStatus.fromCode((short) code));
    }
}
