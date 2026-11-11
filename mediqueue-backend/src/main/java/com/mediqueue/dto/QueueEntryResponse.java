package com.mediqueue.dto;

import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.entity.enums.QueueStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** One row of a doctor's queue. queuePosition is null once the visit is finished. */
public record QueueEntryResponse(
        Long queueId,
        Long appointmentId,
        String patientId,
        String patientName,
        String doctorId,
        LocalDate appointmentDate,
        LocalDateTime slotStart,
        LocalDateTime slotEnd,
        String reasonForVisit,
        Priority priority,
        Integer queuePosition,
        QueueStatus visitStatus,
        AppointmentStatus appointmentStatus,
        LocalDateTime calledAt,
        Integer overridePosition,
        boolean hasPrescription) {}
