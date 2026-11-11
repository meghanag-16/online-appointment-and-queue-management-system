package com.mediqueue.dto;

import com.mediqueue.entity.Patient;

import java.time.LocalDate;

/** Safe view of a patient's profile (no password hash). */
public record PatientProfileDTO(
    String userId,
    String name,
    String username,
    String email,
    String role,
    String accountStatus,
    String gender,
    String phoneNumber,
    LocalDate dateOfBirth,
    String bloodGroup,
    String allergies,
    String chronicConditions,
    String emergencyContact
) {
    public static PatientProfileDTO from(Patient p) {
        return new PatientProfileDTO(
            p.getUserId(), p.getName(), p.getUsername(), p.getEmail(), "PATIENT",
            p.getAccountStatus() != null ? p.getAccountStatus().name() : null,
            p.getGender(), p.getPhoneNumber(), p.getDateOfBirth(),
            p.getBloodGroup(), p.getAllergies(), p.getChronicConditions(), p.getEmergencyContact());
    }
}
