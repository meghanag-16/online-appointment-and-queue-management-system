package com.mediqueue.dto;

import com.mediqueue.entity.Prescription;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PrescriptionResponse(
    Long prescriptionId,
    Long appointmentId,
    String patientId,
    String patientName,
    String doctorId,
    String doctorName,
    String diagnosisNotes,
    String medicationList,
    String advice,
    LocalDate followUpDate,
    LocalDateTime issuedAt
) {
    public static PrescriptionResponse from(Prescription p) {
        var a = p.getAppointment();
        return new PrescriptionResponse(
            p.getPrescriptionId(), a.getAppointmentId(),
            a.getPatient().getUserId(), a.getPatient().getName(),
            a.getDoctor().getUserId(), a.getDoctor().getName(),
            p.getDiagnosisNotes(), p.getMedicationList(), p.getAdvice(),
            p.getFollowUpDate(), p.getIssuedAt());
    }
}
