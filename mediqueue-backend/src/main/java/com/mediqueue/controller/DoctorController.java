package com.mediqueue.controller;

import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorDashboardResponse;
import com.mediqueue.dto.QueueEntryResponse;
import com.mediqueue.dto.SlotResponse;
import com.mediqueue.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/doctors/{doctorId}/slots")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<SlotResponse>> getAvailableSlots(@PathVariable String doctorId) {
        return ResponseEntity.ok(doctorService.getAvailableSlots(doctorId));
    }

    /** RECEPTIONIST added: the "Book for Patient" doctor dropdown calls this. */
    @GetMapping("/doctors/search")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<DoctorDTO>> searchDoctors(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(doctorService.searchDoctors(q));
    }

    @GetMapping("/doctor/dashboard/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<DoctorDashboardResponse> getDoctorDashboard(@PathVariable String doctorId) {
        return ResponseEntity.ok(doctorService.getDashboard(doctorId));
    }

    @GetMapping("/doctor/queue/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<List<QueueEntryResponse>> getDoctorQueue(@PathVariable String doctorId) {
        return ResponseEntity.ok(doctorService.getTodayQueue(doctorId));
    }
}
