package com.mediqueue.dto;

import jakarta.validation.constraints.NotNull;

/** Move an appointment to another open slot of the same doctor. */
public record RescheduleRequest(@NotNull(message = "New time slot is required") Long slotId) {}
