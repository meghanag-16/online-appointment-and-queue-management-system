package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;

/** {"priority": "HIGH_PRIORITY" | "NORMAL"} */
public record PriorityUpdateRequest(@NotBlank(message = "Priority is required") String priority) {}
