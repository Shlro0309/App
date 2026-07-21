package com.cybergame.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ReservationResponse(
        Integer id,
        String reservationCode,
        Integer customerId,
        Integer userId,
        String customerName,
        String phoneNumber,
        LocalDateTime reservedAt,
        LocalDateTime expiresAt,
        BigDecimal deposit,
        String status,
        List<ReservationMachineResponse> machines
) {
}
