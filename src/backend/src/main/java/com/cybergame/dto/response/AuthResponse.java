package com.cybergame.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInMinutes,
        UserSummaryResponse user
) {
}
