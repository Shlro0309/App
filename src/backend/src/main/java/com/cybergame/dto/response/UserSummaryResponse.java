package com.cybergame.dto.response;

import java.math.BigDecimal;

public record UserSummaryResponse(
        Integer userId,
        Integer customerId,
        Integer employeeId,
        String username,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        String status,
        BigDecimal balance
) {
}
