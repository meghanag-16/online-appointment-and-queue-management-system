package com.mediqueue.exception;

/** Input that is syntactically valid but breaks a business rule (HTTP 400). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
