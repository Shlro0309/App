package com.cybergame.entity.converter;

import com.cybergame.entity.enums.PersistableEnum;
import jakarta.persistence.AttributeConverter;

import java.util.function.IntFunction;

public abstract class AbstractTinyIntEnumConverter<E extends Enum<E> & PersistableEnum>
        implements AttributeConverter<E, Short> {

    private final IntFunction<E> enumResolver;

    protected AbstractTinyIntEnumConverter(IntFunction<E> enumResolver) {
        this.enumResolver = enumResolver;
    }

    @Override
    public Short convertToDatabaseColumn(E attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public E convertToEntityAttribute(Short dbData) {
        return dbData == null ? null : enumResolver.apply(dbData);
    }
}
