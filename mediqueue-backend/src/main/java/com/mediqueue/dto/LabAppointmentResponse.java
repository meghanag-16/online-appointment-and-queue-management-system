package com.mediqueue.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** An appointment as the lab technician sees it when choosing where to attach a report. */
public record LabAppointmentResponse(
    Long appointmentId,
    String patientId,
    String patientName,
    String doctorName,
    String departmentName,
    LocalDate appointmentDate,
    LocalDateTime startTime,
    String status,
    long reportCount,
    boolean canUpload
) {}
