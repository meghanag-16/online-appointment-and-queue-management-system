package com.mediqueue.dto;

import com.mediqueue.entity.Complaint;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** {@code id} duplicates {@code complaintId}; {@code resolution} is the administrator's saved note. */
public record ComplaintResponse(
    String id,
    String complaintId,
    String patientId,
    String patientName,
    String issueType,
    String description,
    String status,
    LocalDate createdOn,
    String resolution,
    Long appointmentId,
    Long billId,
    LocalDateTime updatedAt,
    LocalDateTime resolvedAt
) {
    public static ComplaintResponse from(Complaint c) {
        return new ComplaintResponse(
            c.getComplaintId(), c.getComplaintId(),
            c.getPatient() != null ? c.getPatient().getUserId() : null,
            c.getPatient() != null ? c.getPatient().getName() : null,
            c.getIssueType(), c.getDescription(),
            c.getResolutionStatus() != null ? c.getResolutionStatus().name() : null,
            c.getCreatedOn(), c.getResolutionNote(),
            c.getAppointment() != null ? c.getAppointment().getAppointmentId() : null,
            c.getBill() != null ? c.getBill().getBillId() : null,
            c.getUpdatedAt(), c.getResolvedAt());
    }
}
