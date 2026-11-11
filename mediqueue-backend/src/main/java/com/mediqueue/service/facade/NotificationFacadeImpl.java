package com.mediqueue.service.facade;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.LabReport;
import com.mediqueue.entity.Notification;
import com.mediqueue.entity.Prescription;
import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.DeliveryStatus;
import com.mediqueue.entity.enums.NotificationType;
import com.mediqueue.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class NotificationFacadeImpl implements NotificationFacade {

    private static final Logger log = LoggerFactory.getLogger(NotificationFacadeImpl.class);
    public static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM yyyy 'at' h:mm a", Locale.ENGLISH);

    private final NotificationRepository notificationRepository;
    private final NotificationSender sender;

    public NotificationFacadeImpl(NotificationRepository notificationRepository, NotificationSender sender) {
        this.notificationRepository = notificationRepository;
        this.sender = sender;
    }

    @Override
    public Notification appointmentReminder(Appointment a) {
        String message = "Reminder: you have an appointment with " + doctor(a.getDoctor())
            + " on " + when(a) + " (appointment #" + a.getAppointmentId() + "). Please arrive 10 minutes early.";
        return deliver(a.getPatient(), NotificationType.APPOINTMENT_REMINDER, message, a.getAppointmentId());
    }

    @Override
    public Notification reportReady(LabReport r) {
        Appointment a = r.getAppointment();
        String message = "Your lab report \"" + r.getReportType() + "\" for appointment #" + a.getAppointmentId()
            + " is ready. You can view and download it under Lab Reports.";
        return deliver(a.getPatient(), NotificationType.REPORT_READY, message, a.getAppointmentId());
    }

    @Override
    public Notification prescriptionAvailable(Prescription p) {
        Appointment a = p.getAppointment();
        String message = doctor(a.getDoctor()) + " has issued your prescription for appointment #"
            + a.getAppointmentId() + ". You can see it under Prescriptions.";
        return deliver(a.getPatient(), NotificationType.PRESCRIPTION_AVAILABLE, message, a.getAppointmentId());
    }

    @Override
    public Notification generalAlert(User recipient, String message, Long appointmentId) {
        return deliver(recipient, NotificationType.GENERAL_ALERT, message, appointmentId);
    }

    /** "Dr. Name", without doubling the title when the stored name already has it. */
    public static String doctor(com.mediqueue.entity.Doctor d) {
        String name = d.getName() == null ? "" : d.getName().trim();
        return name.matches("(?i)^dr\\.?\\s.*") ? name : "Dr. " + name;
    }

    public static String when(Appointment a) {
        LocalDateTime start = a.getSlot() != null ? a.getSlot().getStartTime() : null;
        return start != null ? WHEN.format(start) : String.valueOf(a.getAppointmentDate());
    }

    /** Store first, then send; a sender failure never breaks the action that caused the notification. */
    private Notification deliver(User recipient, NotificationType type, String message, Long appointmentId) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setType(type);
        n.setMessage(message);
        n.setAppointmentId(appointmentId);
        n.setChannel(sender.channel());
        n.setDeliveryStatus(DeliveryStatus.PENDING);
        try {
            sender.send(recipient, type, message);
            n.setDeliveryStatus(DeliveryStatus.SENT);
        } catch (RuntimeException e) {
            log.warn("Could not deliver {} to user {} via {}: {}", type, recipient.getUserId(), sender.channel(), e.getMessage());
            n.setDeliveryStatus(DeliveryStatus.FAILED);
        }
        return notificationRepository.save(n);
    }
}
