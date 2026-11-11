package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.QueueEntryResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.VirtualQueue;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.QueueStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.repository.VirtualQueueRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.AppointmentService;
import com.mediqueue.service.QueueService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class QueueServiceImpl implements QueueService {

    private final VirtualQueueRepository queueRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final QueueManager queueManager;
    private final AppointmentService appointmentService;
    private final AccessGuard accessGuard;
    private final CurrentUserService currentUser;
    private final AuditService auditService;

    public QueueServiceImpl(VirtualQueueRepository queueRepository,
                            PrescriptionRepository prescriptionRepository,
                            QueueManager queueManager,
                            AppointmentService appointmentService,
                            AccessGuard accessGuard,
                            CurrentUserService currentUser,
                            AuditService auditService) {
        this.queueRepository = queueRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.queueManager = queueManager;
        this.appointmentService = appointmentService;
        this.accessGuard = accessGuard;
        this.currentUser = currentUser;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueEntryResponse> getQueue(String doctorId, LocalDate date) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        LocalDate day = date != null ? date : LocalDate.now();
        List<VirtualQueue> entries = queueRepository.findByDoctor_UserIdAndQueueDate(doctorId, day);
        List<Long> ids = entries.stream().map(e -> e.getAppointment().getAppointmentId()).toList();
        Set<Long> withPrescription = ids.isEmpty() ? Set.of()
            : new HashSet<>(prescriptionRepository.findAppointmentIdsWithPrescription(ids));
        return entries.stream()
            .sorted(Comparator.comparing(VirtualQueue::getQueuePosition, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(VirtualQueueTimes::slotStart, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(e -> toResponse(e, withPrescription.contains(e.getAppointment().getAppointmentId())))
            .toList();
    }

    @Override
    public QueueEntryResponse callNext(String doctorId) {
        requireRunsQueue(doctorId);
        List<VirtualQueue> today = queueRepository.findByDoctor_UserIdAndQueueDate(doctorId, LocalDate.now());
        VirtualQueue busy = today.stream()
            .filter(e -> e.getVisitStatus() == QueueStatus.CALLED || e.getVisitStatus() == QueueStatus.IN_CONSULTATION)
            .findFirst().orElse(null);
        if (busy != null) {
            throw new BadRequestException(busy.getAppointment().getPatient().getName() + " is already "
                + (busy.getVisitStatus() == QueueStatus.CALLED ? "called" : "in consultation")
                + ". Finish that visit (or mark a no-show) before calling the next patient.");
        }
        VirtualQueue next = today.stream()
            .filter(e -> e.getVisitStatus() == QueueStatus.WAITING)
            .min(Comparator.comparing(VirtualQueue::getQueuePosition, Comparator.nullsLast(Comparator.naturalOrder())))
            .orElseThrow(() -> new BadRequestException("Nobody is waiting in today's queue"));
        next.setVisitStatus(QueueStatus.CALLED);
        next.setCalledAt(LocalDateTime.now());
        next.setOverridePosition(null);
        queueRepository.saveAndFlush(next);
        queueManager.reorder(doctorId, next.getQueueDate());
        return toResponse(next, false);
    }

    @Override
    public QueueEntryResponse start(Long queueId) {
        VirtualQueue e = findToday(queueId);
        if (e.getVisitStatus() != QueueStatus.CALLED) {
            throw new BadRequestException("Call the patient in first (status is " + label(e.getVisitStatus()) + ")");
        }
        appointmentService.updateStatus(e.getAppointment().getAppointmentId(), AppointmentStatus.IN_PROGRESS.name());
        return toResponse(reload(queueId), false);
    }

    @Override
    public QueueEntryResponse finish(Long queueId) {
        VirtualQueue e = findToday(queueId);
        if (e.getVisitStatus() != QueueStatus.IN_CONSULTATION) {
            throw new BadRequestException("Only a patient in consultation can be finished (status is " + label(e.getVisitStatus()) + ")");
        }
        Long appointmentId = e.getAppointment().getAppointmentId();
        appointmentService.updateStatus(appointmentId, AppointmentStatus.COMPLETED.name());
        return toResponse(reload(queueId), prescriptionRepository.existsByAppointment_AppointmentId(appointmentId));
    }

    @Override
    public void markNoShow(Long queueId) {
        VirtualQueue e = findToday(queueId);
        if (e.getVisitStatus() != QueueStatus.CALLED) {
            throw new BadRequestException("Only a called patient can be marked as a no-show");
        }
        appointmentService.updateStatus(e.getAppointment().getAppointmentId(), AppointmentStatus.NO_SHOW.name());
    }

    @Override
    public List<QueueEntryResponse> overridePosition(Long queueId, Integer position) {
        if (!currentUser.get().is(UserRole.ADMINISTRATOR)) {
            throw new ForbiddenException("Access denied: only an administrator can override the queue order");
        }
        VirtualQueue e = find(queueId);
        if (e.getVisitStatus() != QueueStatus.WAITING) {
            throw new BadRequestException("Only waiting patients can be moved (status is " + label(e.getVisitStatus()) + ")");
        }
        e.setOverridePosition(position);
        queueRepository.saveAndFlush(e);
        auditService.record(AuditAction.QUEUE_POSITION_OVERRIDDEN, "QUEUE_ENTRY", queueId,
            e.getAppointment().getPatient().getName() + " in " + com.mediqueue.util.DisplayText.doctor(e.getDoctor()) + "'s queue on "
                + e.getQueueDate() + (position == null ? ": override cleared" : ": pinned to position " + position));
        queueManager.reorder(e.getDoctor().getUserId(), e.getQueueDate());
        return getQueue(e.getDoctor().getUserId(), e.getQueueDate());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** The doctor runs their own queue; the front desk and administrators may help. */
    private void requireRunsQueue(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
    }

    private VirtualQueue find(Long queueId) {
        return queueRepository.findById(queueId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found: " + queueId));
    }

    private VirtualQueue findToday(Long queueId) {
        VirtualQueue e = find(queueId);
        requireRunsQueue(e.getDoctor().getUserId());
        if (!LocalDate.now().equals(e.getQueueDate())) {
            throw new BadRequestException("This patient is in the queue for " + e.getQueueDate() + ", not today");
        }
        return e;
    }

    private VirtualQueue reload(Long queueId) {
        return queueRepository.findById(queueId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found: " + queueId));
    }

    private static String label(QueueStatus s) {
        return s.name().replace('_', ' ').toLowerCase();
    }

    private static QueueEntryResponse toResponse(VirtualQueue e, boolean hasPrescription) {
        Appointment a = e.getAppointment();
        return new QueueEntryResponse(
            e.getQueueId(), a.getAppointmentId(),
            a.getPatient().getUserId(), a.getPatient().getName(), e.getDoctor().getUserId(),
            a.getAppointmentDate(),
            a.getSlot() != null ? a.getSlot().getStartTime() : null,
            a.getSlot() != null ? a.getSlot().getEndTime() : null,
            a.getReasonForVisit(), a.getPriority(),
            e.getQueuePosition(), e.getVisitStatus(), a.getAppointmentStatus(),
            e.getCalledAt(), e.getOverridePosition(), hasPrescription);
    }

    /** Small helper so the comparator above reads cleanly. */
    private static final class VirtualQueueTimes {
        static LocalDateTime slotStart(VirtualQueue e) {
            return e.getAppointment().getSlot() != null ? e.getAppointment().getSlot().getStartTime() : null;
        }
    }
}
