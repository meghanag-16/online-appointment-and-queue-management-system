package com.mediqueue.dto;

import com.mediqueue.entity.enums.Priority;
import com.mediqueue.entity.enums.QueueStatus;

import java.time.LocalDate;

public record QueueEntryResponse(
    Long queueId,
    Long appointmentId,
    String patientName,
    LocalDate appointmentDate,
    Priority priority,
    Integer queuePosition,
    QueueStatus visitStatus
) {}
