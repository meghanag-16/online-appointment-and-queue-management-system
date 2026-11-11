package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Administrator's general alert. Send to one user ({@code userId}) or to every active user of a
 * role ({@code role}, e.g. PATIENT); exactly one of the two must be given.
 */
public record AlertRequest(
        String userId,
        String role,
        @NotBlank(message = "Message is required")
                @Size(max = 1000, message = "Message must be at most 1000 characters")
                String message) {}
