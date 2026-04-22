package com.mediqueue.controller;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.MedicalRecord;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.LabReportRepository;
import com.mediqueue.repository.MedicalRecordRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/patient")
public class PatientController {

    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final ComplaintRepository complaintRepository;
    private final LabReportRepository labReportRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public PatientController(AppointmentRepository appointmentRepository,
                             BillRepository billRepository,
                             ComplaintRepository complaintRepository,
                             LabReportRepository labReportRepository,
                             MedicalRecordRepository medicalRecordRepository) {
        this.appointmentRepository = appointmentRepository;
        this.billRepository = billRepository;
        this.complaintRepository = complaintRepository;
        this.labReportRepository = labReportRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    @GetMapping("/dashboard/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> getPatientDashboard(@PathVariable String patientId) {
        List<Appointment> appointments = appointmentRepository.findByPatient_UserId(patientId);
        LocalDate today = LocalDate.now();

        long upcomingAppointments = appointments.stream()
                .filter(a -> a.getAppointmentDate() != null)
                .filter(a -> !a.getAppointmentDate().isBefore(today))
                .filter(a -> a.getAppointmentStatus() != AppointmentStatus.CANCELLED)
                .count();

        long pendingBills = billRepository.findByAppointment_Patient_UserId(patientId).stream()
                .filter(b -> b.getPaymentStatus() != PaymentStatus.PAID)
                .count();

        long reportsReady = labReportRepository.findByAppointment_Patient_UserId(patientId).size();

        long openComplaints = complaintRepository.findByPatient_UserId(patientId).stream()
                .filter(c -> c.getResolutionStatus() == ResolutionStatus.OPEN)
                .count();

        return ResponseEntity.ok(Map.of(
                "upcomingAppointments", upcomingAppointments,
                "pendingBills", pendingBills,
                "reportsReady", reportsReady,
                "openComplaints", openComplaints
        ));
    }

    @GetMapping("/records/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> getPatientRecords(@PathVariable String patientId) {
        MedicalRecord record = medicalRecordRepository.findByPatient_UserId(patientId).orElse(null);
        Map<String, Object> result = new HashMap<>();
        if (record == null) {
            result.put("recordId", "");
            result.put("diagnoses", "No diagnoses recorded yet.");
            result.put("observations", "No observations recorded yet.");
        } else {
            result.put("recordId", record.getRecordId() != null ? record.getRecordId().toString() : "");
            result.put("diagnoses", record.getDiagnoses() != null ? record.getDiagnoses() : "No diagnoses recorded yet.");
            result.put("observations", record.getObservations() != null ? record.getObservations() : "No observations recorded yet.");
        }
        return ResponseEntity.ok(result);
    }
}
