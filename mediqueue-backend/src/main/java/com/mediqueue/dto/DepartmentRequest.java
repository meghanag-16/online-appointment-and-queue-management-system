package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** New department: just its name (unknown JSON fields are ignored). */
public record DepartmentRequest(
    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must be at most 100 characters")
    String departmentName
) {}
