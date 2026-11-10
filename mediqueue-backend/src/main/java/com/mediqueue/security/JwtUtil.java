package com.mediqueue.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret:dev-secret-key-for-miniproject-minimum-32-chars}")
    private String secret;

    private static final long EXPIRATION_MS = 86_400_000L; // 24 h
    private static final int MIN_SECRET_BYTES = 32;         // HS256 minimum key size

    /**
     * Fail fast at startup with a clear message instead of failing every login later.
     * A short secret makes Keys.hmacShaKeyFor throw WeakKeyException, which previously
     * surfaced only as a generic 500 on login/register and silently rejected every token.
     */
    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.getBytes().length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                "app.jwt.secret (APP_JWT_SECRET) must be at least " + MIN_SECRET_BYTES
                + " characters long for HS256; current length is "
                + (secret == null ? 0 : secret.getBytes().length));
        }
    }

    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
            .setSubject(username)
            .claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
            .signWith(key(), SignatureAlgorithm.HS256)
            .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        try { parseClaims(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
