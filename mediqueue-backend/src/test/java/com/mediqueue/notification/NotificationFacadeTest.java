package com.mediqueue.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.LabReport;
import com.mediqueue.entity.Notification;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.DeliveryStatus;
import com.mediqueue.entity.enums.NotificationType;
import com.mediqueue.repository.NotificationRepository;
import com.mediqueue.service.facade.NotificationFacadeImpl;
import com.mediqueue.service.facade.NotificationSender;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** The facade stores every notification and records whether the (mocked) sender delivered it. */
class NotificationFacadeTest {

    private NotificationRepository repository;
    private NotificationSender sender;
    private NotificationFacadeImpl facade;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        repository = mock(NotificationRepository.class);
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        sender = mock(NotificationSender.class);
        when(sender.channel()).thenReturn("TEST");
        facade = new NotificationFacadeImpl(repository, sender);

        Patient patient = new Patient();
        patient.setUserId("PAT-1");
        patient.setName("Asha");
        Doctor doctor = new Doctor();
        doctor.setName("Rao");
        TimeSlot slot = new TimeSlot();
        slot.setStartTime(LocalDateTime.of(2026, 11, 12, 10, 0));
        appointment = new Appointment();
        appointment.setAppointmentId(42L);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSlot(slot);
    }

    @Test
    void reminderIsStoredAsSentForThePatient() {
        Notification n = facade.appointmentReminder(appointment);

        verify(sender)
                .send(
                        eq(appointment.getPatient()),
                        eq(NotificationType.APPOINTMENT_REMINDER),
                        contains("Dr. Rao"));
        assertEquals(DeliveryStatus.SENT, n.getDeliveryStatus());
        assertEquals(42L, n.getAppointmentId());
        assertEquals("TEST", n.getChannel());
        assertFalse(n.isRead());
        assertTrue(n.getMessage().contains("Thu 12 Nov 2026 at 10:00 AM"), n.getMessage());
    }

    @Test
    void doctorTitleIsNotDoubled() {
        Doctor d = new Doctor();
        d.setName("Dr. Arjun Mehta");
        assertEquals("Dr. Arjun Mehta", com.mediqueue.util.DisplayText.doctor(d));
        d.setName("Arjun Mehta");
        assertEquals("Dr. Arjun Mehta", com.mediqueue.util.DisplayText.doctor(d));
    }

    @Test
    void aFailingSenderIsRecordedAsFailedWithoutThrowing() {
        doThrow(new IllegalStateException("SMTP down"))
                .when(sender)
                .send(any(), any(), anyString());
        LabReport report = new LabReport();
        report.setAppointment(appointment);
        report.setReportType("Blood test");

        Notification n = assertDoesNotThrow(() -> facade.reportReady(report));

        assertEquals(DeliveryStatus.FAILED, n.getDeliveryStatus());
        assertEquals(NotificationType.REPORT_READY, n.getType());
        verify(repository).save(n); // still stored, so it shows in the patient's bell
    }
}
