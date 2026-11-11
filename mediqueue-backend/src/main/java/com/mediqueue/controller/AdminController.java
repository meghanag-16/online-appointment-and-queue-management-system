package com.mediqueue.controller;

import com.mediqueue.dto.AdminDashboardResponse;
import com.mediqueue.dto.DepartmentDTO;
import com.mediqueue.dto.DepartmentRequest;
import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.service.AdminService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminController {

    private final AdminService adminService;
    private final Validator validator;

    public AdminController(AdminService adminService, Validator validator) {
        this.adminService = adminService;
        this.validator = validator;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorDTO>> getAllDoctors() {
        return ResponseEntity.ok(adminService.getAllDoctors());
    }

    /**
     * Onboard a doctor. Takes the same profile fields as self-registration (RegisterRequest),
     * including a username and an initial password chosen by the administrator.
     */
    @PostMapping("/doctors")
    public ResponseEntity<DoctorDTO> onboardDoctor(@RequestBody RegisterRequest request) {
        // The role is implied by this endpoint, so set it before validating the rest of the fields.
        request.setRole(UserRole.DOCTOR);
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) throw new ConstraintViolationException(violations);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.onboardDoctor(request));
    }

    @PutMapping("/doctors/{doctorId}/deactivate")
    public ResponseEntity<DoctorDTO> deactivateDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(adminService.deactivateDoctor(doctorId));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(adminService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDTO> addDepartment(@Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addDepartment(request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboard());
    }
}
