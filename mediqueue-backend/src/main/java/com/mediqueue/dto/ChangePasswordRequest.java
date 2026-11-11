package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A logged-in user changes their own password (e.g. the initial one the administrator gave them).
 */
public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required") String currentPassword,
        @NotBlank(message = "New password is required")
                @Size(min = 8, max = 100, message = "New password must be at least 8 characters")
                String newPassword) {}
