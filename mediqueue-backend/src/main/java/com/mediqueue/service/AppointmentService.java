package com.mediqueue.service;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.AppointmentStatsResponse;
import com.mediqueue.dto.BookAppointmentRequest;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {
    AppointmentResponse bookAppointment(BookAppointmentRequest request);
    AppointmentResponse getAppointment(Long appointmentId);
    List<AppointmentResponse> getAppointmentsForPatient(String patientId);
    List<AppointmentResponse> getAppointmentsForDoctor(String doctorId);
    /** Cancels and frees the slot. Patients must do it before the cutoff; staff any time before the visit. */
    AppointmentResponse cancelAppointment(Long appointmentId);
    /** Moves the appointment to another open slot of the same doctor (same cutoff rule as cancel). */
    AppointmentResponse rescheduleAppointment(Long appointmentId, Long newSlotId);
    /** All appointments, optionally for one date (receptionist/administrator). */
    List<AppointmentResponse> getAll(LocalDate date);
    /** Status change following the allowed transitions; CANCELLED also frees the slot. */
    AppointmentResponse updateStatus(Long appointmentId, String status);
    AppointmentStatsResponse getStats();
    /** Receptionist/administrator marks an appointment HIGH_PRIORITY (or back to NORMAL); the queue reorders. */
    AppointmentResponse updatePriority(Long appointmentId, String priority);
}
