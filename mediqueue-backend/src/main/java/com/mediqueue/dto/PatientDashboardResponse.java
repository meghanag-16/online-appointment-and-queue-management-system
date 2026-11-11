package com.mediqueue.dto;

public record PatientDashboardResponse(long upcomingAppointments, long pendingBills,
                                       long reportsReady, long openComplaints) {}
