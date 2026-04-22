package com.mediqueue.controller;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Prescription;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.PrescriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;

    public PrescriptionController(PrescriptionRepository prescriptionRepository,
                                   AppointmentRepository appointmentRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<?> createPrescription(@RequestBody Map<String, String> request) {
        try {
            Long appointmentId = Long.parseLong(request.get("appointmentId"));
            Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElse(null);
            if (appointment == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Appointment not found: " + appointmentId));
            }
            // Check if prescription already exists
            if (prescriptionRepository.findByAppointment_AppointmentId(appointmentId).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Prescription already exists for this appointment."));
            }
            Prescription prescription = new Prescription();
            prescription.setAppointment(appointment);
            prescription.setDiagnosisNotes(request.get("diagnosisNotes"));
            prescription.setMedicationList(request.get("medicationList"));
            prescription.setAdvice(request.get("advice"));
            if (request.get("followUpDate") != null && !request.get("followUpDate").isBlank()) {
                prescription.setFollowUpDate(java.time.LocalDate.parse(request.get("followUpDate")));
            }
            Prescription saved = prescriptionRepository.save(prescription);
            Map<String, Object> resp = new HashMap<>();
            resp.put("prescriptionId", saved.getPrescriptionId());
            resp.put("appointmentId", appointmentId);
            resp.put("message", "Prescription created successfully.");
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid appointment ID."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getPrescriptionsByDoctor(@PathVariable String doctorId) {
        List<Map<String, Object>> response = prescriptionRepository.findByAppointment_Doctor_UserId(doctorId).stream().map(prescription -> {
            Map<String, Object> item = new HashMap<>();
            item.put("prescriptionId", prescription.getPrescriptionId());
            item.put("appointmentId", prescription.getAppointment().getAppointmentId());
            item.put("patientName", prescription.getAppointment().getPatient().getName());
            item.put("diagnosisNotes", prescription.getDiagnosisNotes());
            item.put("medicationList", prescription.getMedicationList());
            item.put("advice", prescription.getAdvice());
            item.put("issuedAt", prescription.getIssuedAt());
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
