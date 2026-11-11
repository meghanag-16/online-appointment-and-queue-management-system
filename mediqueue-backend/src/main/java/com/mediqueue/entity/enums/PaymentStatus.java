package com.mediqueue.entity.enums;

/** VOID: the visit was cancelled before anything was paid, so nothing is owed. */
public enum PaymentStatus {
    PENDING, PAID, FAILED, REFUNDED, VOID
}
