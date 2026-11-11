package com.mediqueue.dto;

import jakarta.validation.constraints.Min;

/** Administrator override: move a waiting patient to this position; null clears the override. */
public record QueuePositionRequest(
        @Min(value = 1, message = "Position must be 1 or more") Integer position) {}
