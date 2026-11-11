package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {"status": "UNDER_REVIEW" | "RESOLVED", "note": "..."} — the note is required to resolve. */
public record ComplaintStatusRequest(
        @NotBlank(message = "Status is required") String status,
        @Size(max = 4000, message = "The note must be at most 4000 characters") String note) {}
