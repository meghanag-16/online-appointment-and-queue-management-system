package com.mediqueue.dto;

import com.mediqueue.entity.LabReport;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A lab report as shown in lists. The stored file path is never sent; use the download endpoint. */
public record LabReportResponse(
    Long reportId,
    Long appointmentId,
    LocalDate appointmentDate,
    String reportType,
    String fileName,
    String contentType,
    Long fileSize,
    LocalDateTime uploadTime,
    String remarks,
    String patientId,
    String patientName,
    String doctorId,
    String doctorName
) {
    public static LabReportResponse from(LabReport r) {
        var a = r.getAppointment();
        return new LabReportResponse(
            r.getReportId(),
            a != null ? a.getAppointmentId() : null,
            a != null ? a.getAppointmentDate() : null,
            r.getReportType(), r.getOriginalFileName() != null ? r.getOriginalFileName() : "report-" + r.getReportId(),
            r.getContentType(), r.getFileSize(), r.getUploadTime(), r.getRemarks(),
            a != null && a.getPatient() != null ? a.getPatient().getUserId() : null,
            a != null && a.getPatient() != null ? a.getPatient().getName() : null,
            a != null && a.getDoctor() != null ? a.getDoctor().getUserId() : null,
            a != null && a.getDoctor() != null ? a.getDoctor().getName() : null);
    }
}
