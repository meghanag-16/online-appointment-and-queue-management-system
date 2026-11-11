package com.mediqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * patientId is used only when a receptionist/administrator books on a patient's behalf; for a
 * patient it is ignored and taken from the login. priority and createdByRole are likewise decided
 * by the server from the caller's role, not trusted from the body.
 */

public class BookAppointmentRequest {
    private String patientId;
    @NotBlank(message = "Doctor is required")
    private String doctorId;
    @NotNull(message = "Time slot is required")
    private Long slotId;
    private LocalDate appointmentDate;
    @Size(max = 2000, message = "Reason for visit must be at most 2000 characters")
    private String reasonForVisit;
    private String priority;
    private String createdByRole;

    public BookAppointmentRequest() {}

    public BookAppointmentRequest(String patientId, String doctorId, Long slotId, LocalDate appointmentDate, String reasonForVisit, String priority, String createdByRole) {
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.slotId = slotId;
        this.appointmentDate = appointmentDate;
        this.reasonForVisit = reasonForVisit;
        this.priority = priority;
        this.createdByRole = createdByRole;
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }
}
