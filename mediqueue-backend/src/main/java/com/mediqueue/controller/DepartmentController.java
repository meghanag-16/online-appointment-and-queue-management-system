package com.mediqueue.controller;

import com.mediqueue.dto.DepartmentDTO;
import com.mediqueue.service.AdminService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, read-only department list (id + name only). The sign-up form needs it before the user has
 * an account, so doctors can pick their department. Creating departments stays administrator-only
 * under /api/v1/admin/departments.
 */
@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final AdminService adminService;

    public DepartmentController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> list() {
        return ResponseEntity.ok(adminService.getAllDepartments());
    }
}
