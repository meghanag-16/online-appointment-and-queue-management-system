package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * {@code appointmentId} and {@code billId} are optional; when given they must be the patient's own.
 */
public record ComplaintRequest(
    @Size(max = 100, message = "Issue type must be at most 100 characters") String issueType,
    @NotBlank(message = "Please describe the issue")
    @Size(max = 4000, message = "Description must be at most 4000 characters") String description,
    String appointmentId,
    String billId
) {}
