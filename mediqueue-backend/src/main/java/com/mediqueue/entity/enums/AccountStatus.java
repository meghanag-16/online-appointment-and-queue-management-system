package com.mediqueue.entity.enums;

/** Only ACTIVE accounts can log in. Staff accounts are created ACTIVE by an administrator. */
public enum AccountStatus {
    ACTIVE,
    SUSPENDED,
    DEACTIVATED;

    /** Human-readable form used in login/401 messages. */
    public static String describe(AccountStatus status) {
        return switch (status) {
            case ACTIVE -> "active";
            case SUSPENDED -> "suspended. Please contact the hospital administrator";
            case DEACTIVATED -> "deactivated. Please contact the hospital administrator";
        };
    }
}
