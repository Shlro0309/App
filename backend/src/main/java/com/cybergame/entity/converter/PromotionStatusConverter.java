package com.cybergame.entity.converter;

import com.cybergame.entity.enums.PromotionStatus;
import jakarta.persistence.Converter;

@Converter
public class PromotionStatusConverter extends AbstractTinyIntEnumConverter<PromotionStatus> {

    public PromotionStatusConverter() {
        super(code -> PromotionStatus.fromCode((short) code));
    }
}
