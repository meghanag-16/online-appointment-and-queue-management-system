package com.mediqueue.event;

import java.time.LocalDate;

/**
 * Something happened to an appointment. Published by AppointmentService, received by every
 * {@link AppointmentObserver} (Observer pattern).
 *
 * previousDoctorId / previousDate are set only for RESCHEDULED, so observers can tidy up the
 * day the appointment moved away from.
 */
public record AppointmentEvent(
    AppointmentEventType type,
    Long appointmentId,
    String previousDoctorId,
    LocalDate previousDate
) {
    public static AppointmentEvent of(AppointmentEventType type, Long appointmentId) {
        return new AppointmentEvent(type, appointmentId, null, null);
    }

    public static AppointmentEvent rescheduled(Long appointmentId, String previousDoctorId, LocalDate previousDate) {
        return new AppointmentEvent(AppointmentEventType.RESCHEDULED, appointmentId, previousDoctorId, previousDate);
    }
}
