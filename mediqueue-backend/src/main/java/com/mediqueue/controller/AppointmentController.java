package com.mediqueue.controller;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.AppointmentStatsResponse;
import com.mediqueue.dto.BookAppointmentRequest;
import com.mediqueue.dto.StatusUpdateRequest;
import com.mediqueue.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Role checks are here (@PreAuthorize); ownership checks ("is this MY appointment?") are in
 * AppointmentService via AccessGuard.
 */
@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody BookAppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.bookAppointment(req));
    }

    /** Receptionist/Admin: all appointments, optional ?date=YYYY-MM-DD. */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAll(date));
    }

    /** Receptionist/Admin: dashboard stats. */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<AppointmentStatsResponse> getStats() {
        return ResponseEntity.ok(appointmentService.getStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','LAB_TECHNICIAN','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointment(id));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<AppointmentResponse>> byPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<AppointmentResponse>> byDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForDoctor(doctorId));
    }

    /** Receptionist/Admin, or the doctor on the appointment: update status. */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR','DOCTOR')")
    public ResponseEntity<AppointmentResponse> updateStatus(@PathVariable Long id,
                                                            @Valid @RequestBody StatusUpdateRequest body) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, body.status()));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }
}
