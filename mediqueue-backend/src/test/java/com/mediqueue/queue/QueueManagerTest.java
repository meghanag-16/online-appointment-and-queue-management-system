package com.mediqueue.queue;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.VirtualQueue;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.entity.enums.QueueStatus;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentEventPublisher;
import com.mediqueue.event.AppointmentEventType;
import com.mediqueue.event.AppointmentObserver;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.VirtualQueueRepository;
import com.mediqueue.service.impl.QueueManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** The queue ordering rule and the Observer wiring, without a database. */
class QueueManagerTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 12);

    private VirtualQueueRepository queueRepository;
    private AppointmentRepository appointmentRepository;
    private QueueManager manager;
    private final List<VirtualQueue> store = new ArrayList<>();
    private Doctor doctor;
    private long nextId = 1;

    @BeforeEach
    void setUp() {
        queueRepository = mock(VirtualQueueRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        manager = new QueueManager(queueRepository, appointmentRepository);
        doctor = new Doctor();
        doctor.setUserId("DOC-1");
        when(queueRepository.findByDoctor_UserIdAndQueueDate(eq("DOC-1"), eq(TODAY)))
                .thenAnswer(inv -> new ArrayList<>(store));
    }

    private VirtualQueue entry(int hour, Priority priority, QueueStatus status) {
        Patient p = new Patient();
        p.setUserId("P-" + nextId);
        TimeSlot slot = new TimeSlot();
        slot.setStartTime(TODAY.atTime(hour, 0));
        Appointment a = new Appointment();
        a.setAppointmentId(nextId);
        a.setPatient(p);
        a.setDoctor(doctor);
        a.setSlot(slot);
        a.setPriority(priority);
        a.setAppointmentDate(TODAY);
        VirtualQueue e = new VirtualQueue();
        e.setQueueId(nextId++);
        e.setAppointment(a);
        e.setDoctor(doctor);
        e.setQueueDate(TODAY);
        e.setVisitStatus(status);
        store.add(e);
        return e;
    }

    @Test
    void normalPatientsAreOrderedBySlotTime() {
        VirtualQueue late = entry(11, Priority.NORMAL, QueueStatus.WAITING);
        VirtualQueue early = entry(9, Priority.NORMAL, QueueStatus.WAITING);
        manager.reorder("DOC-1", TODAY);
        assertEquals(1, early.getQueuePosition());
        assertEquals(2, late.getQueuePosition());
    }

    @Test
    void highPriorityGoesFirstAmongWaiting() {
        VirtualQueue normal = entry(9, Priority.NORMAL, QueueStatus.WAITING);
        VirtualQueue urgent = entry(15, Priority.HIGH_PRIORITY, QueueStatus.WAITING);
        manager.reorder("DOC-1", TODAY);
        assertEquals(1, urgent.getQueuePosition());
        assertEquals(2, normal.getQueuePosition());
    }

    @Test
    void highPriorityNeverJumpsAheadOfACalledPatient() {
        VirtualQueue called = entry(10, Priority.NORMAL, QueueStatus.CALLED);
        called.setCalledAt(LocalDateTime.now());
        VirtualQueue urgent = entry(9, Priority.HIGH_PRIORITY, QueueStatus.WAITING);
        manager.reorder("DOC-1", TODAY);
        assertEquals(1, called.getQueuePosition());
        assertEquals(2, urgent.getQueuePosition());
    }

    @Test
    void finishedVisitsHaveNoPositionAndLeaveNoGap() {
        VirtualQueue done = entry(9, Priority.NORMAL, QueueStatus.FINISHED);
        VirtualQueue a = entry(10, Priority.NORMAL, QueueStatus.WAITING);
        VirtualQueue b = entry(11, Priority.NORMAL, QueueStatus.WAITING);
        manager.reorder("DOC-1", TODAY);
        assertNull(done.getQueuePosition());
        assertEquals(1, a.getQueuePosition());
        assertEquals(2, b.getQueuePosition());
    }

    @Test
    void administratorOverridePinsAWaitingPatient() {
        VirtualQueue first = entry(9, Priority.NORMAL, QueueStatus.WAITING);
        VirtualQueue second = entry(10, Priority.NORMAL, QueueStatus.WAITING);
        VirtualQueue last = entry(11, Priority.NORMAL, QueueStatus.WAITING);
        last.setOverridePosition(1);
        manager.reorder("DOC-1", TODAY);
        assertEquals(1, last.getQueuePosition());
        assertEquals(2, first.getQueuePosition());
        assertEquals(3, second.getQueuePosition());
    }

    @Test
    void cancellationEventRemovesTheEntry() {
        VirtualQueue e = entry(9, Priority.NORMAL, QueueStatus.WAITING);
        Appointment a = e.getAppointment();
        a.setAppointmentStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findById(a.getAppointmentId())).thenReturn(Optional.of(a));
        when(queueRepository.findByAppointment_AppointmentId(a.getAppointmentId()))
                .thenReturn(Optional.of(e));
        doAnswer(
                        inv -> {
                            store.remove(e);
                            return null;
                        })
                .when(queueRepository)
                .delete(e);

        manager.onAppointmentEvent(
                AppointmentEvent.of(AppointmentEventType.CANCELLED, a.getAppointmentId()));

        verify(queueRepository).delete(e);
        assertTrue(store.isEmpty());
    }

    @Test
    void publisherNotifiesEveryRegisteredObserver() {
        List<AppointmentEvent> seen = new ArrayList<>();
        AppointmentObserver first = seen::add;
        AppointmentObserver second = seen::add;
        AppointmentEventPublisher publisher = new AppointmentEventPublisher(List.of(first));
        publisher.register(second);

        publisher.publish(AppointmentEvent.of(AppointmentEventType.BOOKED, 42L));

        assertEquals(2, seen.size());
        assertEquals(42L, seen.get(0).appointmentId());
    }
}
