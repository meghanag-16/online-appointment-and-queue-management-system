package com.mediqueue.service.impl;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.VirtualQueue;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.entity.enums.QueueStatus;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentEventType;
import com.mediqueue.event.AppointmentObserver;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.VirtualQueueRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Keeps the virtual queue (one per doctor per day) in step with appointments.
 *
 * <p>It is an {@link AppointmentObserver}: every booking, cancellation, reschedule, status change
 * and priority change is pushed to it, and it adds, moves or removes the queue entry and then
 * recalculates the positions for that doctor and day.
 *
 * <p>Ordering rule (fairness): 1. Patients already being seen (IN_CONSULTATION) and then those
 * already called (CALLED) stay at the front, in the order they were called. Nobody can jump ahead
 * of them. 2. Waiting patients: HIGH_PRIORITY first, then by slot time, then by booking order. 3.
 * An administrator override pins a waiting patient to a chosen position (it can never go ahead of
 * rule 1). Finished visits keep their entry (status FINISHED) but have no position.
 *
 * <p>Visit status follows the appointment: BOOKED/CONFIRMED → WAITING (or CALLED once called),
 * IN_PROGRESS → IN_CONSULTATION, COMPLETED → FINISHED, CANCELLED/NO_SHOW → removed.
 */
@Component
public class QueueManager implements AppointmentObserver {

    private static final Logger log = LoggerFactory.getLogger(QueueManager.class);
    private static final Set<AppointmentStatus> IN_QUEUE =
            EnumSet.of(
                    AppointmentStatus.BOOKED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS);

    private final VirtualQueueRepository queueRepository;
    private final AppointmentRepository appointmentRepository;

    public QueueManager(
            VirtualQueueRepository queueRepository, AppointmentRepository appointmentRepository) {
        this.queueRepository = queueRepository;
        this.appointmentRepository = appointmentRepository;
    }

    // ── Observer ─────────────────────────────────────────────────────────────

    @Override
    public void onAppointmentEvent(AppointmentEvent event) {
        Appointment a = appointmentRepository.findById(event.appointmentId()).orElse(null);
        if (a == null) return;
        sync(a, event.type() == AppointmentEventType.RESCHEDULED);
        if (event.type() == AppointmentEventType.RESCHEDULED && event.previousDate() != null) {
            reorder(event.previousDoctorId(), event.previousDate());
        }
    }

    /**
     * Brings the appointment's queue entry in line with its current status, then reorders its day.
     */
    private void sync(Appointment a, boolean moved) {
        VirtualQueue entry =
                queueRepository.findByAppointment_AppointmentId(a.getAppointmentId()).orElse(null);
        AppointmentStatus status = a.getAppointmentStatus();
        LocalDate oldDate = entry != null ? entry.getQueueDate() : null;
        String oldDoctor = entry != null ? entry.getDoctor().getUserId() : null;

        if (status == AppointmentStatus.CANCELLED || status == AppointmentStatus.NO_SHOW) {
            if (entry != null) {
                queueRepository.delete(entry);
                queueRepository.flush();
                reorder(oldDoctor, oldDate);
            }
            return;
        }

        if (entry == null) {
            entry = new VirtualQueue();
            entry.setAppointment(a);
        }
        entry.setDoctor(a.getDoctor());
        entry.setQueueDate(a.getAppointmentDate());
        if (moved) { // a new time: back to the normal waiting order
            entry.setVisitStatus(QueueStatus.WAITING);
            entry.setCalledAt(null);
            entry.setOverridePosition(null);
        }
        switch (status) {
            case IN_PROGRESS -> {
                entry.setVisitStatus(QueueStatus.IN_CONSULTATION);
                if (entry.getCalledAt() == null) entry.setCalledAt(LocalDateTime.now());
            }
            case COMPLETED -> entry.setVisitStatus(QueueStatus.FINISHED);
            default -> {
                if (entry.getVisitStatus() == null
                        || entry.getVisitStatus() == QueueStatus.FINISHED
                        || entry.getVisitStatus() == QueueStatus.IN_CONSULTATION) {
                    entry.setVisitStatus(QueueStatus.WAITING);
                }
            }
        }
        queueRepository.saveAndFlush(entry);

        reorder(a.getDoctor().getUserId(), a.getAppointmentDate());
        if (oldDate != null
                && (!oldDate.equals(a.getAppointmentDate())
                        || !oldDoctor.equals(a.getDoctor().getUserId()))) {
            reorder(oldDoctor, oldDate);
        }
    }

    // ── ordering ─────────────────────────────────────────────────────────────

    /** Recalculates positions 1..n for one doctor's queue on one day. */
    public void reorder(String doctorId, LocalDate date) {
        if (doctorId == null || date == null) return;
        List<VirtualQueue> entries =
                queueRepository.findByDoctor_UserIdAndQueueDate(doctorId, date);

        List<VirtualQueue> serving = new ArrayList<>();
        List<VirtualQueue> waiting = new ArrayList<>();
        for (VirtualQueue e : entries) {
            switch (e.getVisitStatus()) {
                case IN_CONSULTATION, CALLED -> serving.add(e);
                case WAITING -> waiting.add(e);
                case FINISHED -> e.setQueuePosition(null);
            }
        }
        serving.sort(
                Comparator.comparing(
                                (VirtualQueue e) ->
                                        e.getVisitStatus() == QueueStatus.IN_CONSULTATION ? 0 : 1)
                        .thenComparing(
                                VirtualQueue::getCalledAt,
                                Comparator.nullsLast(Comparator.naturalOrder())));
        waiting.sort(
                Comparator.comparing(
                                (VirtualQueue e) ->
                                        e.getAppointment().getPriority() == Priority.HIGH_PRIORITY
                                                ? 0
                                                : 1)
                        .thenComparing(
                                QueueManager::slotStart,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(
                                VirtualQueue::getQueueId,
                                Comparator.nullsLast(Comparator.naturalOrder())));

        // Administrator overrides: pin to the requested position (never ahead of those being
        // served).
        List<VirtualQueue> pinned =
                waiting.stream()
                        .filter(e -> e.getOverridePosition() != null)
                        .sorted(Comparator.comparing(VirtualQueue::getOverridePosition))
                        .toList();
        waiting.removeAll(pinned);
        for (VirtualQueue e : pinned) {
            int index = e.getOverridePosition() - 1 - serving.size();
            waiting.add(Math.max(0, Math.min(index, waiting.size())), e);
        }

        int position = 1;
        for (VirtualQueue e : serving) e.setQueuePosition(position++);
        for (VirtualQueue e : waiting) e.setQueuePosition(position++);
        queueRepository.saveAll(entries);
    }

    private static LocalDateTime slotStart(VirtualQueue e) {
        return e.getAppointment().getSlot() != null
                ? e.getAppointment().getSlot().getStartTime()
                : null;
    }

    // ── start-up repair ──────────────────────────────────────────────────────

    /**
     * Makes sure every live appointment from today on has a queue entry (appointments booked before
     * the queue existed, or data changed by hand) and recalculates those days.
     */
    @Transactional
    public int rebuildFrom(LocalDate fromDate) {
        int created = 0;
        Set<String> days = new java.util.HashSet<>();
        for (Appointment a :
                appointmentRepository.findByAppointmentDateGreaterThanEqualAndAppointmentStatusIn(
                        fromDate, IN_QUEUE)) {
            if (queueRepository.findByAppointment_AppointmentId(a.getAppointmentId()).isEmpty())
                created++;
            sync(a, false);
            days.add(a.getDoctor().getUserId() + "|" + a.getAppointmentDate());
        }
        log.info(
                "[QueueManager] Queue checked for {} doctor-day(s); {} missing entr(y/ies) added",
                days.size(),
                created);
        return created;
    }
}
