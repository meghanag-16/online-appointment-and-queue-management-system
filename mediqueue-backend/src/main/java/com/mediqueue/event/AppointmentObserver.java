package com.mediqueue.event;

/**
 * Observer in the Observer pattern: anything that must react when an appointment is booked,
 * cancelled, rescheduled, changes status or changes priority (e.g. the virtual queue).
 * Every Spring bean implementing this interface is registered with {@link AppointmentEventPublisher}.
 */
public interface AppointmentObserver {
    void onAppointmentEvent(AppointmentEvent event);
}
