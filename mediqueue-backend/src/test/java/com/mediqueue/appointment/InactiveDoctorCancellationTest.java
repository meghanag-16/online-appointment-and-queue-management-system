package com.mediqueue.appointment;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentEventPublisher;
import com.mediqueue.event.AppointmentEventType;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.SlotService;
import com.mediqueue.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** When a doctor is suspended or deactivated, their upcoming appointments are cancelled. */
class InactiveDoctorCancellationTest {

    @Test
    void cancelsUpcomingAppointmentsAndWithdrawsTheirSlots() {
        AppointmentRepository appointments = mock(AppointmentRepository.class);
        TimeSlotRepository slots = mock(TimeSlotRepository.class);
        AppointmentEventPublisher events = mock(AppointmentEventPublisher.class);
        AppointmentServiceImpl service = new AppointmentServiceImpl(appointments, mock(PatientRepository.class), slots,
            mock(SlotService.class), mock(CurrentUserService.class), mock(AccessGuard.class), events,
            mock(PrescriptionRepository.class));

        Doctor doctor = new Doctor();
        doctor.setUserId("DOC-1");
        doctor.setAccountStatus(AccountStatus.DEACTIVATED);   // status is changed before the cancellation runs
        Appointment first = booked(1L, doctor, 11L);
        Appointment second = booked(2L, doctor, 12L);
        when(appointments.findByDoctor_UserIdAndAppointmentStatusInAndSlot_StartTimeAfter(eq("DOC-1"), anyCollection(), any()))
            .thenReturn(List.of(first, second));
        when(slots.findByIdForUpdate(11L)).thenReturn(Optional.of(first.getSlot()));
        when(slots.findByIdForUpdate(12L)).thenReturn(Optional.of(second.getSlot()));

        int cancelled = service.cancelUpcomingForDoctor("DOC-1");

        assertEquals(2, cancelled);
        for (Appointment a : List.of(first, second)) {
            assertEquals(AppointmentStatus.CANCELLED, a.getAppointmentStatus());
            // the doctor is inactive, so the slot is withdrawn rather than reopened for booking
            assertEquals(SlotStatus.CANCELLED, a.getSlot().getStatus());
        }
        ArgumentCaptor<AppointmentEvent> published = ArgumentCaptor.forClass(AppointmentEvent.class);
        verify(events, times(2)).publish(published.capture());
        published.getAllValues().forEach(e -> assertEquals(AppointmentEventType.CANCELLED, e.type()));
    }

    private static Appointment booked(Long id, Doctor doctor, Long slotId) {
        TimeSlot slot = new TimeSlot(slotId, doctor, LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(1).plusMinutes(30),
            SlotStatus.BOOKED);
        Appointment a = new Appointment();
        a.setAppointmentId(id);
        a.setDoctor(doctor);
        a.setPatient(new Patient());
        a.setSlot(slot);
        a.setAppointmentStatus(AppointmentStatus.BOOKED);
        return a;
    }
}
