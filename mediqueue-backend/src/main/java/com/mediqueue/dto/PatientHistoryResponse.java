package com.mediqueue.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Everything a treating doctor needs before a consultation: the patient's basics, allergies and
 * chronic conditions, the medical record, every prescription so far, and past visits.
 * A doctor sees only visits with themself; the patient and staff see all visits.
 */
public record PatientHistoryResponse(
    String patientId,
    String name,
    String gender,
    LocalDate dateOfBirth,
    Integer age,
    String phoneNumber,
    String bloodGroup,
    String allergies,
    String chronicConditions,
    String emergencyContact,
    String diagnoses,
    String observations,
    List<PrescriptionResponse> prescriptions,
    List<AppointmentResponse> visits
) {}
