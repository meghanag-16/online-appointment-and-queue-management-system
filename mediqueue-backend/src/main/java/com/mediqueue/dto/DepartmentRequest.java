package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {@code description} is accepted from the form but not stored yet (no column for it). */
public record DepartmentRequest(
    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must be at most 100 characters")
    String departmentName,
    String description
) {}
