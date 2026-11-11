package com.mediqueue.controller;

import com.mediqueue.dto.LabReportResponse;
import com.mediqueue.service.LabService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lab")
public class LabController {

    private final LabService labService;

    public LabController(LabService labService) {
        this.labService = labService;
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<LabReportResponse> uploadReport(@RequestParam Long appointmentId,
                                                          @RequestParam MultipartFile file,
                                                          @RequestParam(required = false) String remarks) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labService.upload(appointmentId, file, remarks));
    }

    /** Patients see their own appointment's reports, doctors their own patients'; ownership checked in LabService. */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','LAB_TECHNICIAN','ADMINISTRATOR')")
    public ResponseEntity<List<LabReportResponse>> getReportsByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(labService.getReportsForAppointment(appointmentId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN','ADMINISTRATOR')")
    public ResponseEntity<List<LabReportResponse>> getAllReports() {
        return ResponseEntity.ok(labService.getAllReports());
    }
}
