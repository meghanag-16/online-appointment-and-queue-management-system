package com.mediqueue.controller;

import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorDashboardResponse;
import com.mediqueue.dto.QueueEntryResponse;
import com.mediqueue.dto.SlotResponse;
import com.mediqueue.service.DoctorService;
import com.mediqueue.service.QueueService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class DoctorController {

    private final DoctorService doctorService;
    private final QueueService queueService;

    public DoctorController(DoctorService doctorService, QueueService queueService) {
        this.doctorService = doctorService;
        this.queueService = queueService;
    }

    /** Open future slots; ?date=YYYY-MM-DD for one day only. Empty for an inactive doctor. */
    @GetMapping("/doctors/{doctorId}/slots")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<SlotResponse>> getAvailableSlots(
            @PathVariable String doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(doctorService.getAvailableSlots(doctorId, date));
    }

    /**
     * ?q= name / specialization / department text, ?departmentId=, ?date=YYYY-MM-DD (only doctors
     * with an open slot that day). Only active doctors are returned.
     */
    @GetMapping("/doctors/search")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<DoctorDTO>> searchDoctors(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(doctorService.searchDoctors(q, departmentId, date));
    }

    @GetMapping("/doctor/dashboard/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<DoctorDashboardResponse> getDoctorDashboard(@PathVariable String doctorId) {
        return ResponseEntity.ok(doctorService.getDashboard(doctorId));
    }

    @GetMapping("/doctor/queue/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<List<QueueEntryResponse>> getDoctorQueue(@PathVariable String doctorId) {
        return ResponseEntity.ok(queueService.getQueue(doctorId, null));   // same as GET /queue/doctor/{id}
    }
}
