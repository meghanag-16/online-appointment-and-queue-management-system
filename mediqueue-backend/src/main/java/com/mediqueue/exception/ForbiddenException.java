package com.mediqueue.exception;

/** Thrown when the logged-in user is authenticated but not allowed to touch a resource (HTTP 403). */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) { super(message); }
}
