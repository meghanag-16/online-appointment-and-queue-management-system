package com.mediqueue.dto;

import com.mediqueue.entity.LabReport;

import java.time.LocalDateTime;

public record LabReportResponse(
    Long reportId,
    Long appointmentId,
    String reportType,
    LocalDateTime uploadTime,
    String filePath,
    String remarks,
    String patientId,
    String doctorId
) {
    public static LabReportResponse from(LabReport r) {
        var a = r.getAppointment();
        return new LabReportResponse(
            r.getReportId(),
            a != null ? a.getAppointmentId() : null,
            r.getReportType(), r.getUploadTime(), r.getFilePath(), r.getRemarks(),
            a != null && a.getPatient() != null ? a.getPatient().getUserId() : null,
            a != null && a.getDoctor() != null ? a.getDoctor().getUserId() : null);
    }
}
