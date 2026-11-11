package com.mediqueue.dto;

public record AdminDashboardResponse(long totalUsers, long totalDoctors,
                                     long activeAppointments, long openComplaints) {}
