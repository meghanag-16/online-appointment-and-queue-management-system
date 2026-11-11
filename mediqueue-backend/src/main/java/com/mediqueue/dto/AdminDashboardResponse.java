package com.mediqueue.dto;

import java.math.BigDecimal;

/**
 * Administrator overview, all counted in the database. - activeAppointments: booked/confirmed/in
 * progress from today on (past ones never marked are not counted); - unpaidBills / unpaidAmount:
 * pending or failed bills (void and refunded bills are not owed); - collectedAmount: total of paid
 * bills.
 */
public record AdminDashboardResponse(
        long totalUsers,
        long activeUsers,
        long activePatients,
        long totalDoctors,
        long inactiveUsers,
        long todaysAppointments,
        long activeAppointments,
        long openComplaints,
        long unpaidBills,
        BigDecimal unpaidAmount,
        BigDecimal collectedAmount) {}
