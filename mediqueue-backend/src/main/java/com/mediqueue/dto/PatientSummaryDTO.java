package com.mediqueue.dto;

import com.mediqueue.entity.Patient;

/** Minimal patient info for the receptionist's patient picker. */
public record PatientSummaryDTO(
        String userId, String name, String username, String phoneNumber, String email) {
    public static PatientSummaryDTO from(Patient p) {
        return new PatientSummaryDTO(
                p.getUserId(), p.getName(), p.getUsername(), p.getPhoneNumber(), p.getEmail());
    }
}
