package com.cybergame.dto.response;

import java.time.LocalDateTime;

public record StationReservationResponse(
        Integer reservationId,
        String reservationCode,
        Integer machineId,
        String machineName,
        LocalDateTime expiresAt,
        String status
) {
}
