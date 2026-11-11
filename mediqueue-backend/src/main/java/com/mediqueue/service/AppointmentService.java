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
    AppointmentResponse cancelAppointment(Long appointmentId);
    /** All appointments, optionally for one date (receptionist/administrator). */
    List<AppointmentResponse> getAll(LocalDate date);
    AppointmentResponse updateStatus(Long appointmentId, String status);
    AppointmentStatsResponse getStats();
}
