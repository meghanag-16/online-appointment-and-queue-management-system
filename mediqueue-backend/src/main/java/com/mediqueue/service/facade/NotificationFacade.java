package com.mediqueue.service.facade;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.LabReport;
import com.mediqueue.entity.Notification;
import com.mediqueue.entity.Prescription;
import com.mediqueue.entity.User;

/**
 * Facade over notifications: callers say what happened, the facade writes the message, stores it
 * (so it appears in the user's bell) and hands it to the delivery channel, recording SENT or
 * FAILED.
 */
public interface NotificationFacade {
    Notification appointmentReminder(Appointment appointment);

    Notification reportReady(LabReport report);

    Notification prescriptionAvailable(Prescription prescription);

    Notification generalAlert(User recipient, String message, Long appointmentId);
}
