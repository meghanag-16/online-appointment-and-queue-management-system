package com.mediqueue.dto;

import com.mediqueue.entity.Complaint;

import java.time.LocalDate;

/** {@code id} duplicates {@code complaintId} for the existing admin page. */
public record ComplaintResponse(
    String id,
    String complaintId,
    String patientId,
    String patientName,
    String issueType,
    String description,
    String status,
    LocalDate createdOn,
    String resolution
) {
    public static ComplaintResponse from(Complaint c) {
        return from(c, null);
    }

    public static ComplaintResponse from(Complaint c, String resolution) {
        return new ComplaintResponse(
            c.getComplaintId(), c.getComplaintId(),
            c.getPatient() != null ? c.getPatient().getUserId() : null,
            c.getPatient() != null ? c.getPatient().getName() : null,
            c.getIssueType(), c.getDescription(),
            c.getResolutionStatus() != null ? c.getResolutionStatus().name() : null,
            c.getCreatedOn(), resolution);
    }
}
