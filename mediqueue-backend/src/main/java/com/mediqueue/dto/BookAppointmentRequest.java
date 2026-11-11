package com.mediqueue.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Booking request. The server decides everything it can instead of trusting the body:
 *  - patientId is used only when a receptionist/administrator books on a patient's behalf;
 *    a patient always books for themself.
 *  - the appointment date and the doctor come from the slot. doctorId is optional; if sent it
 *    must match the slot's doctor.
 *  - priority is honoured only for receptionists/administrators; patients are always NORMAL.
 */
public class BookAppointmentRequest {
    private String patientId;
    private String doctorId;
    @NotNull(message = "Time slot is required")
    private Long slotId;
    @Size(max = 2000, message = "Reason for visit must be at most 2000 characters")
    private String reasonForVisit;
    private String priority;

    public BookAppointmentRequest() {}

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
}
