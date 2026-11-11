package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PrescriptionRequest(
    @NotNull(message = "Appointment ID is required") Long appointmentId,
    @NotBlank(message = "Diagnosis notes are required") String diagnosisNotes,
    @NotBlank(message = "Medications are required") String medicationList,
    String advice,
    LocalDate followUpDate
) {}
