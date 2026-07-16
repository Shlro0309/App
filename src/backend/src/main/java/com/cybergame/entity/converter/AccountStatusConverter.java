package com.cybergame.entity.converter;

import com.cybergame.entity.enums.AccountStatus;
import jakarta.persistence.Converter;

@Converter
public class AccountStatusConverter extends AbstractTinyIntEnumConverter<AccountStatus> {

    public AccountStatusConverter() {
        super(code -> AccountStatus.fromCode((short) code));
    }
}
