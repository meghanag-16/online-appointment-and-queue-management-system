package com.mediqueue.dto;

import com.mediqueue.entity.Department;

public record DepartmentDTO(String departmentId, String departmentName) {
    public static DepartmentDTO from(Department d) {
        return new DepartmentDTO(d.getDepartmentId(), d.getDepartmentName());
    }
}
