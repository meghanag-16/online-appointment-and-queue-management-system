package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for status changes: {"status": "COMPLETED"} for appointments, {"status": "ACTIVE"} for users. */
public record StatusUpdateRequest(@NotBlank(message = "Status is required") String status) {}
