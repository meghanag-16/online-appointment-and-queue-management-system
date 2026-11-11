package com.mediqueue.controller;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.ComplaintResponse;
import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.service.AdminService;
import com.mediqueue.service.AppointmentService;
import com.mediqueue.service.ComplaintService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Administrator overview lists. These used to return raw JPA entities (leaking password
 * hashes and failing on lazy fields); they now return the same DTOs as the rest of the API.
 */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class DashboardController {

    private final AdminService adminService;
    private final AppointmentService appointmentService;
    private final ComplaintService complaintService;

    public DashboardController(AdminService adminService,
                               AppointmentService appointmentService,
                               ComplaintService complaintService) {
        this.adminService = adminService;
        this.appointmentService = appointmentService;
        this.complaintService = complaintService;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorDTO>> getAllDoctors() {
        return ResponseEntity.ok(adminService.getAllDoctors());
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAll(null));
    }

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAll(null));
    }
}
