package com.cybergame.security;

import com.cybergame.config.SecurityProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "tokenType";

    private final SecurityProperties securityProperties;
    private final SecretKey signingKey;

    public JwtService(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
        this.signingKey = Keys.hmacShaKeyFor(securityProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UserDetails userDetails) {
        Instant expiresAt = Instant.now().plus(securityProperties.accessTokenExpirationMinutes(), ChronoUnit.MINUTES);
        return generateToken(userDetails, TokenType.ACCESS, expiresAt);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        Instant expiresAt = Instant.now().plus(securityProperties.refreshTokenExpirationDays(), ChronoUnit.DAYS);
        return generateToken(userDetails, TokenType.REFRESH, expiresAt);
    }

    public boolean isTokenValid(String token, UserDetails userDetails, TokenType expectedTokenType) {
        String username = extractUsername(token);
        TokenType tokenType = extractTokenType(token);
        return username.equals(userDetails.getUsername())
                && tokenType == expectedTokenType
                && !isTokenExpired(token);
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public TokenType extractTokenType(String token) {
        String tokenType = extractAllClaims(token).get(TOKEN_TYPE_CLAIM, String.class);
        return TokenType.valueOf(tokenType);
    }

    private String generateToken(UserDetails userDetails, TokenType tokenType, Instant expiresAt) {
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("");

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim(TOKEN_TYPE_CLAIM, tokenType.name())
                .claim("role", role)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
