package com.mediqueue.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Administrator edits a doctor's professional details (department, specialization, qualification, fee). */
public record DoctorUpdateRequest(
    @NotBlank(message = "Department is required")
    String departmentId,

    @NotBlank(message = "Specialization is required")
    @Size(max = 100, message = "Specialization must be at most 100 characters")
    String specialization,

    @Size(max = 200, message = "Qualification must be at most 200 characters")
    String qualification,

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", message = "Consultation fee cannot be negative")
    @DecimalMax(value = "99999999.99", message = "Consultation fee is too large")
    BigDecimal consultationFee
) {}
