package com.mediqueue.service.impl;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentObserver;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.service.facade.NotificationFacade;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.util.DisplayText;
import org.springframework.stereotype.Component;

/** Observer: tells the patient when their appointment is booked, moved or cancelled. */
@Component
public class AppointmentNotifier implements AppointmentObserver {

    private final AppointmentRepository appointmentRepository;
    private final NotificationFacade notificationFacade;

    public AppointmentNotifier(AppointmentRepository appointmentRepository, NotificationFacade notificationFacade) {
        this.appointmentRepository = appointmentRepository;
        this.notificationFacade = notificationFacade;
    }

    @Override
    public void onAppointmentEvent(AppointmentEvent event) {
        Appointment a = appointmentRepository.findById(event.appointmentId()).orElse(null);
        if (a == null) return;
        String withDoctor = "with " + DisplayText.doctor(a.getDoctor()) + " on " + DisplayText.when(a)
            + " (appointment #" + a.getAppointmentId() + ")";
        String message = switch (event.type()) {
            case BOOKED -> "Your appointment " + withDoctor + " is booked.";
            case RESCHEDULED -> "Your appointment has been moved. New time: " + withDoctor + ".";
            case CANCELLED -> a.getDoctor().getAccountStatus() != AccountStatus.ACTIVE
                ? "Your appointment " + withDoctor + " has been cancelled because " + DisplayText.doctor(a.getDoctor())
                    + " is no longer available. Please book with another doctor, or contact the front desk."
                : "Your appointment " + withDoctor + " has been cancelled.";
            case STATUS_CHANGED -> a.getAppointmentStatus() == AppointmentStatus.CANCELLED
                ? "Your appointment " + withDoctor + " has been cancelled." : null;
            default -> null;
        };
        if (message != null) notificationFacade.generalAlert(a.getPatient(), message, a.getAppointmentId());
    }
}
