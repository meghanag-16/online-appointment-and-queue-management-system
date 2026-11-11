package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {@code appointmentId} is optional; when given it must be one of the patient's own appointments. */
public record ComplaintRequest(
    @Size(max = 100, message = "Issue type must be at most 100 characters") String issueType,
    @NotBlank(message = "Please describe the issue") String description,
    String appointmentId
) {}
