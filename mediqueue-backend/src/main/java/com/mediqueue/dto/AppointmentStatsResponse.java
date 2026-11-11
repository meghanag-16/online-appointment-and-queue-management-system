package com.mediqueue.dto;

public record AppointmentStatsResponse(long todayTotal, long todayBooked, long todayCompleted,
                                       long todayCancelled, long totalAll) {}
