package com.mediqueue.exception;

/**
 * Missing, invalid or expired credentials (HTTP 401). Ownership problems use {@link
 * ForbiddenException}.
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
