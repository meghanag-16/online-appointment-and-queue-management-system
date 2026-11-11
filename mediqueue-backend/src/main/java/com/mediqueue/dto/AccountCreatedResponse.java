package com.mediqueue.dto;

/**
 * Result of the administrator creating an account or resetting a password. The temporary password
 * is shown once, here, and is never stored in plain text; the user must change it at first login.
 */
public record AccountCreatedResponse(Object user, String temporaryPassword) {}
