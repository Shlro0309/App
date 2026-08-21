package com.cybergame.dto.response;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresInMinutes
) {
}
