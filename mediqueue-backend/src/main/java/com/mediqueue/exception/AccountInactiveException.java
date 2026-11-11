package com.mediqueue.exception;

/** Login attempt for an account that is pending approval, suspended or deactivated (HTTP 403). */
public class AccountInactiveException extends RuntimeException {
    public AccountInactiveException(String message) { super(message); }
}
