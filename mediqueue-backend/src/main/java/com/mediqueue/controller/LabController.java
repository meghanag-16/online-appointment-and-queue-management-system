package com.mediqueue.controller;

import com.mediqueue.dto.LabAppointmentResponse;
import com.mediqueue.dto.LabReportResponse;
import com.mediqueue.service.LabService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    /** ?q= an appointment ID, a patient ID or part of a patient's name. */
    @GetMapping("/appointments")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN','ADMINISTRATOR')")
    public ResponseEntity<List<LabAppointmentResponse>> searchAppointments(@RequestParam String q) {
        return ResponseEntity.ok(labService.searchAppointments(q));
    }

    /** multipart: appointmentId, reportType (test name), file (PDF/PNG/JPEG, max 10 MB), remarks (optional). */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<LabReportResponse> uploadReport(@RequestParam Long appointmentId,
                                                          @RequestParam(required = false) String reportType,
                                                          @RequestParam(required = false) String remarks,
                                                          @RequestParam MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labService.upload(appointmentId, reportType, remarks, file));
    }

    /** Patients see their own appointment's reports, doctors their own patients'; ownership checked in LabService. */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','LAB_TECHNICIAN','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<LabReportResponse>> getReportsByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(labService.getReportsForAppointment(appointmentId));
    }

    /** A patient's own reports (or a doctor's patient's, or staff). */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<LabReportResponse>> getReportsByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(labService.getReportsForPatient(patientId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN','ADMINISTRATOR')")
    public ResponseEntity<List<LabReportResponse>> getAllReports() {
        return ResponseEntity.ok(labService.getAllReports());
    }

    /** The file itself, for whoever may read the appointment's documents (patient, its doctor, lab, staff). */
    @GetMapping("/reports/{reportId}/download")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','LAB_TECHNICIAN','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<Resource> download(@PathVariable Long reportId) {
        LabService.Download d = labService.download(reportId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(d.fileName()).build().toString())   // name is already plain ASCII
            .header("X-Content-Type-Options", "nosniff")
            .contentType(MediaType.parseMediaType(d.contentType()))
            .contentLength(d.size())
            .body(d.resource());
    }
}
