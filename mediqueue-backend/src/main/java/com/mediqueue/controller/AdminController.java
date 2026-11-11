package com.mediqueue.controller;

import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.AccountCreatedResponse;
import com.mediqueue.dto.AdminAccountRequests;
import com.mediqueue.dto.AdminDashboardResponse;
import com.mediqueue.dto.AuditLogResponse;
import com.mediqueue.dto.DepartmentDTO;
import com.mediqueue.dto.DepartmentRequest;
import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorUpdateRequest;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.service.AdminService;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminController {

    private final AdminService adminService;
    private final AuditService auditService;
    private final Validator validator;

    public AdminController(
            AdminService adminService, AuditService auditService, Validator validator) {
        this.adminService = adminService;
        this.auditService = auditService;
        this.validator = validator;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorDTO>> getAllDoctors() {
        return ResponseEntity.ok(adminService.getAllDoctors());
    }

    /**
     * Onboard a doctor with their department. Takes the same profile fields as registration
     * (RegisterRequest); the server generates a temporary password, returned once, which the doctor
     * must change at first login. A duplicate username or email gives 409.
     */
    @PostMapping("/doctors")
    public ResponseEntity<AccountCreatedResponse> onboardDoctor(
            @RequestBody RegisterRequest request) {
        // The role is implied by this endpoint, so set it before validating the rest of the fields.
        request.setRole(UserRole.DOCTOR);
        AdminAccountRequests.validate(validator, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.onboardDoctor(request));
    }

    @PutMapping("/doctors/{doctorId}/deactivate")
    public ResponseEntity<DoctorDTO> deactivateDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(adminService.deactivateDoctor(doctorId));
    }

    /** Department, specialization, qualification and fee of an existing doctor. */
    @PutMapping("/doctors/{doctorId}")
    public ResponseEntity<DoctorDTO> updateDoctor(
            @PathVariable String doctorId, @Valid @RequestBody DoctorUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateDoctor(doctorId, request));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(adminService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDTO> addDepartment(
            @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addDepartment(request));
    }

    /**
     * Audit log, newest first. ?action=&from=yyyy-MM-dd&to=yyyy-MM-dd&q=text&limit=200 (all
     * optional).
     */
    @GetMapping("/audit")
    public ResponseEntity<List<AuditLogResponse>> auditLog(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "200") int limit) {
        return ResponseEntity.ok(auditService.search(action, from, to, q, limit));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboard());
    }
}
