package com.mediqueue.controller;

import com.mediqueue.dto.MedicalRecordResponse;
import com.mediqueue.dto.PatientDashboardResponse;
import com.mediqueue.dto.PatientHistoryResponse;
import com.mediqueue.dto.PatientSummaryDTO;
import com.mediqueue.service.PatientService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patient")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    /** Front desk: find a patient by name, username, phone, email or ID to book on their behalf. */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<PatientSummaryDTO>> searchPatients(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(patientService.searchPatients(q));
    }

    @GetMapping("/dashboard/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','ADMINISTRATOR')")
    public ResponseEntity<PatientDashboardResponse> getPatientDashboard(
            @PathVariable String patientId) {
        return ResponseEntity.ok(patientService.getDashboard(patientId));
    }

    /** Full clinical history: the patient, their treating doctors, or staff. */
    @GetMapping("/history/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<PatientHistoryResponse> getPatientHistory(
            @PathVariable String patientId) {
        return ResponseEntity.ok(patientService.getHistory(patientId));
    }

    /** DOCTOR added: a doctor may read the history of patients on their own appointments. */
    @GetMapping("/records/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<MedicalRecordResponse> getPatientRecords(@PathVariable String patientId) {
        return ResponseEntity.ok(patientService.getMedicalRecord(patientId));
    }
}
