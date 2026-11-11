package com.mediqueue.entity.enums;

/**
 * PENDING_APPROVAL: a self-registered staff account (doctor, lab technician, receptionist,
 * administrator) waiting for an administrator to activate it. Only ACTIVE accounts can log in.
 */
public enum AccountStatus {
    ACTIVE, SUSPENDED, DEACTIVATED, PENDING_APPROVAL;

    /** Human-readable form used in login/401 messages. */
    public static String describe(AccountStatus status) {
        return switch (status) {
            case ACTIVE -> "active";
            case SUSPENDED -> "suspended. Please contact the hospital administrator";
            case DEACTIVATED -> "deactivated. Please contact the hospital administrator";
            case PENDING_APPROVAL -> "awaiting administrator approval";
        };
    }
}
