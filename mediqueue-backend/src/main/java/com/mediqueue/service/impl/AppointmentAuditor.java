package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentObserver;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.util.DisplayText;
import org.springframework.stereotype.Component;

/**
 * Observer: writes bookings, cancellations, moves, no-shows and priority changes to the audit log.
 */
@Component
public class AppointmentAuditor implements AppointmentObserver {

    private final AppointmentRepository appointmentRepository;
    private final AuditService auditService;

    public AppointmentAuditor(
            AppointmentRepository appointmentRepository, AuditService auditService) {
        this.appointmentRepository = appointmentRepository;
        this.auditService = auditService;
    }

    @Override
    public void onAppointmentEvent(AppointmentEvent event) {
        Appointment a = appointmentRepository.findById(event.appointmentId()).orElse(null);
        if (a == null) return;
        String who =
                a.getPatient().getName()
                        + " with "
                        + DisplayText.doctor(a.getDoctor())
                        + " on "
                        + DisplayText.when(a);
        switch (event.type()) {
            case BOOKED ->
                    record(
                            AuditAction.APPOINTMENT_BOOKED,
                            a,
                            who + (a.getPriority() != null ? " (" + a.getPriority() + ")" : ""));
            case CANCELLED -> record(AuditAction.APPOINTMENT_CANCELLED, a, who);
            case RESCHEDULED ->
                    record(
                            AuditAction.APPOINTMENT_RESCHEDULED,
                            a,
                            "Moved: "
                                    + who
                                    + (event.previousDate() != null
                                            ? " (was " + event.previousDate() + ")"
                                            : ""));
            case PRIORITY_CHANGED ->
                    record(AuditAction.PRIORITY_CHANGED, a, who + " → " + a.getPriority());
            case STATUS_CHANGED -> {
                if (a.getAppointmentStatus() == AppointmentStatus.CANCELLED) {
                    record(AuditAction.APPOINTMENT_CANCELLED, a, who);
                } else if (a.getAppointmentStatus() == AppointmentStatus.NO_SHOW) {
                    record(AuditAction.APPOINTMENT_STATUS_CHANGED, a, who + " → No show");
                }
            }
        }
    }

    private void record(AuditAction action, Appointment a, String details) {
        auditService.record(action, "APPOINTMENT", a.getAppointmentId(), details);
    }
}
