package com.mediqueue.controller;

import com.mediqueue.dto.MedicalRecordResponse;
import com.mediqueue.dto.PatientDashboardResponse;
import com.mediqueue.service.PatientService;
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

    @GetMapping("/dashboard/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','ADMINISTRATOR')")
    public ResponseEntity<PatientDashboardResponse> getPatientDashboard(@PathVariable String patientId) {
        return ResponseEntity.ok(patientService.getDashboard(patientId));
    }

    /** DOCTOR added: a doctor may read the history of patients on their own appointments. */
    @GetMapping("/records/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<MedicalRecordResponse> getPatientRecords(@PathVariable String patientId) {
        return ResponseEntity.ok(patientService.getMedicalRecord(patientId));
    }
}
