package com.mediqueue.dto;

public record DoctorDashboardResponse(
        long todaysAppointments, long inQueue, long pendingPrescriptions, long completedToday) {}
