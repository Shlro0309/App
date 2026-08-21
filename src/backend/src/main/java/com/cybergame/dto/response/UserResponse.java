package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserResponse(
        Integer id,
        String username,
        String fullName,
        String phoneNumber,
        String email,
        String role,
        String status,
        Integer customerId,
        BigDecimal customerBalance,
        Integer employeeId,
        LocalDateTime createdAt
) {
}
