package com.mediqueue.controller;

import com.mediqueue.dto.PrescriptionRequest;
import com.mediqueue.dto.PrescriptionResponse;
import com.mediqueue.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Lab technicians and patients cannot create prescriptions; only the appointment's doctor can. */
@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<PrescriptionResponse> createPrescription(@Valid @RequestBody PrescriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionService.create(request));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionsByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(prescriptionService.getByDoctor(doctorId));
    }
}
