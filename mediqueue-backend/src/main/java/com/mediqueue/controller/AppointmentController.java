package com.mediqueue.controller;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.BookAppointmentRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;

    public AppointmentController(AppointmentService appointmentService,
                                  AppointmentRepository appointmentRepository) {
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<AppointmentResponse> book(@RequestBody BookAppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.bookAppointment(req));
    }

    @GetMapping("/{id}")
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

    /** Receptionist/Admin: get ALL appointments with optional date filter */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getAllAppointments(
            @RequestParam(required = false) String date) {
        List<Appointment> appointments;
        if (date != null && !date.isBlank()) {
            appointments = appointmentRepository.findByAppointmentDate(LocalDate.parse(date));
        } else {
            appointments = appointmentRepository.findAll();
        }
        List<Map<String, Object>> response = appointments.stream().map(a -> {
            Map<String, Object> item = new HashMap<>();
            item.put("appointmentId", a.getAppointmentId());
            item.put("patientName", a.getPatient() != null ? a.getPatient().getName() : "—");
            item.put("patientId",   a.getPatient() != null ? a.getPatient().getUserId() : "—");
            item.put("doctorName",  a.getDoctor()  != null ? a.getDoctor().getName()  : "—");
            item.put("doctorId",    a.getDoctor()  != null ? a.getDoctor().getUserId() : "—");
            item.put("appointmentDate", a.getAppointmentDate());
            item.put("reasonForVisit",  a.getReasonForVisit());
            item.put("status",    a.getAppointmentStatus());
            item.put("priority",  a.getPriority());
            item.put("slotId",    a.getSlot() != null ? a.getSlot().getSlotId() : null);
            item.put("startTime", a.getSlot() != null ? a.getSlot().getStartTime() : null);
            item.put("endTime",   a.getSlot() != null ? a.getSlot().getEndTime()   : null);
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /** Receptionist/Admin: update appointment status */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR','DOCTOR')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        try {
            Appointment a = appointmentRepository.findById(id)
                .orElse(null);
            if (a == null) return ResponseEntity.notFound().build();
            a.setAppointmentStatus(AppointmentStatus.valueOf(body.get("status").toUpperCase()));
            appointmentRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "Status updated", "appointmentId", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Receptionist/Admin: dashboard stats */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> getStats() {
        LocalDate today = LocalDate.now();
        List<Appointment> all = appointmentRepository.findAll();
        long todayTotal    = all.stream().filter(a -> today.equals(a.getAppointmentDate())).count();
        long todayBooked   = all.stream().filter(a -> today.equals(a.getAppointmentDate()) && a.getAppointmentStatus() == AppointmentStatus.BOOKED).count();
        long todayDone     = all.stream().filter(a -> today.equals(a.getAppointmentDate()) && a.getAppointmentStatus() == AppointmentStatus.COMPLETED).count();
        long todayCancelled= all.stream().filter(a -> today.equals(a.getAppointmentDate()) && a.getAppointmentStatus() == AppointmentStatus.CANCELLED).count();
        long totalAll      = all.size();
        Map<String, Object> stats = new HashMap<>();
        stats.put("todayTotal",     todayTotal);
        stats.put("todayBooked",    todayBooked);
        stats.put("todayCompleted", todayDone);
        stats.put("todayCancelled", todayCancelled);
        stats.put("totalAll",       totalAll);
        return ResponseEntity.ok(stats);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }
}
