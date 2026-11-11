package com.mediqueue.service.impl;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.AppointmentResponse.AlternateSlot;
import com.mediqueue.dto.AppointmentStatsResponse;
import com.mediqueue.dto.BookAppointmentRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.CreatedByRole;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.exception.SlotUnavailableException;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentEventPublisher;
import com.mediqueue.event.AppointmentEventType;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.AuthenticatedUser;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.AppointmentService;
import com.mediqueue.service.SlotService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.mediqueue.entity.enums.AppointmentStatus.*;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    /** Appointments that still hold their slot. */
    private static final Set<AppointmentStatus> LIVE = EnumSet.of(BOOKED, CONFIRMED, IN_PROGRESS);
    /** Appointments that can still be cancelled or moved. */
    private static final Set<AppointmentStatus> CHANGEABLE = EnumSet.of(BOOKED, CONFIRMED);

    /**
     * Allowed status changes. BOOKED → CONFIRMED → IN_PROGRESS → COMPLETED is the normal path
     * (a walk-in may go straight from BOOKED to IN_PROGRESS); CANCELLED and NO_SHOW end it early.
     * COMPLETED, CANCELLED and NO_SHOW are final.
     */
    private static final Map<AppointmentStatus, Set<AppointmentStatus>> TRANSITIONS = new EnumMap<>(Map.of(
        BOOKED,      EnumSet.of(CONFIRMED, IN_PROGRESS, CANCELLED, NO_SHOW),
        CONFIRMED,   EnumSet.of(IN_PROGRESS, CANCELLED, NO_SHOW),
        IN_PROGRESS, EnumSet.of(COMPLETED),
        COMPLETED,   EnumSet.noneOf(AppointmentStatus.class),
        CANCELLED,   EnumSet.noneOf(AppointmentStatus.class),
        NO_SHOW,     EnumSet.noneOf(AppointmentStatus.class)));

    /** Doctors run the consultation; confirming and cancelling is the front desk's job. */
    private static final Set<AppointmentStatus> DOCTOR_TARGETS = EnumSet.of(IN_PROGRESS, COMPLETED, NO_SHOW);

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final SlotService slotService;
    private final CurrentUserService currentUser;
    private final AccessGuard accessGuard;
    private final AppointmentEventPublisher events;
    private final PrescriptionRepository prescriptionRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  PatientRepository patientRepository,
                                  TimeSlotRepository timeSlotRepository,
                                  SlotService slotService,
                                  CurrentUserService currentUser,
                                  AccessGuard accessGuard,
                                  AppointmentEventPublisher events,
                                  PrescriptionRepository prescriptionRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.slotService = slotService;
        this.currentUser = currentUser;
        this.accessGuard = accessGuard;
        this.events = events;
        this.prescriptionRepository = prescriptionRepository;
    }

    // ── booking ──────────────────────────────────────────────────────────────

    @Override
    public AppointmentResponse bookAppointment(BookAppointmentRequest req) {
        AuthenticatedUser me = currentUser.get();
        boolean byPatient = me.is(UserRole.PATIENT);

        // Who is the patient? A patient always books for themself; the body's patientId is ignored.
        String patientId = byPatient ? me.userId() : trimToNull(req.getPatientId());
        if (patientId == null) {
            throw new BadRequestException("Choose the patient you are booking for");
        }
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        if (patient.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("This patient's account is " + patient.getAccountStatus().name().toLowerCase(Locale.ROOT));
        }

        // Lock the slot row until commit, so two simultaneous bookings cannot both get it.
        TimeSlot slot = lockSlot(req.getSlotId());
        Doctor doctor = slot.getDoctor();

        String requestedDoctor = trimToNull(req.getDoctorId());
        if (requestedDoctor != null && !requestedDoctor.equals(doctor.getUserId())) {
            throw new BadRequestException("This time slot belongs to a different doctor");
        }
        requireBookable(slot, true);
        requireNoClash(patient.getUserId(), slot, byPatient);

        slot.setStatus(SlotStatus.BOOKED);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSlot(slot);
        appointment.setAppointmentDate(slot.getStartTime().toLocalDate());   // always the slot's date
        appointment.setReasonForVisit(trimToNull(req.getReasonForVisit()));
        // Only front-desk staff may mark a booking high priority; patients are always NORMAL.
        appointment.setPriority(byPatient ? Priority.NORMAL : parsePriority(req.getPriority()));
        appointment.setCreatedByRole(byPatient ? CreatedByRole.PATIENT : CreatedByRole.RECEPTIONIST);
        appointment.setAppointmentStatus(BOOKED);

        Appointment saved = appointmentRepository.saveAndFlush(appointment);
        // Observers: the queue adds the patient, billing creates the bill, the patient is notified, the audit log records it.
        events.publish(AppointmentEvent.of(AppointmentEventType.BOOKED, saved.getAppointmentId()));
        return toResponse(saved, context());
    }

    // ── reads ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointment(Long appointmentId) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentRead(a);
        return toResponse(a, context());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsForPatient(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        AuthenticatedUser me = currentUser.get();
        // A doctor sees only this patient's appointments with them, not with other doctors.
        List<Appointment> appointments = me.is(UserRole.DOCTOR)
            ? appointmentRepository.findByDoctor_UserIdAndPatient_UserId(me.userId(), patientId)
            : appointmentRepository.findByPatient_UserId(patientId);
        return toResponses(appointments, NEWEST_FIRST);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsForDoctor(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        return toResponses(appointmentRepository.findByDoctor_UserId(doctorId), NEWEST_FIRST);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAll(LocalDate date) {
        return date != null
            ? toResponses(appointmentRepository.findByAppointmentDate(date), EARLIEST_FIRST)
            : toResponses(appointmentRepository.findAll(), NEWEST_FIRST);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentStatsResponse getStats() {
        LocalDate today = LocalDate.now();
        return new AppointmentStatsResponse(
            appointmentRepository.countByAppointmentDate(today),
            appointmentRepository.countByAppointmentDateAndAppointmentStatus(today, BOOKED),
            appointmentRepository.countByAppointmentDateAndAppointmentStatus(today, COMPLETED),
            appointmentRepository.countByAppointmentDateAndAppointmentStatus(today, CANCELLED),
            appointmentRepository.count());
    }

    // ── cancel / reschedule ──────────────────────────────────────────────────

    @Override
    public AppointmentResponse cancelAppointment(Long appointmentId) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentWrite(a);
        Context ctx = context();
        requireChangeAllowed(a, ctx, "cancelled");
        cancel(a);
        Appointment saved = appointmentRepository.saveAndFlush(a);
        events.publish(AppointmentEvent.of(AppointmentEventType.CANCELLED, saved.getAppointmentId()));
        return toResponse(saved, ctx);
    }

    @Override
    public AppointmentResponse rescheduleAppointment(Long appointmentId, Long newSlotId) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentWrite(a);
        Context ctx = context();
        requireChangeAllowed(a, ctx, "rescheduled");

        TimeSlot oldSlot = a.getSlot();
        if (oldSlot != null && oldSlot.getSlotId().equals(newSlotId)) {
            throw new BadRequestException("Pick a different time from the current one");
        }
        TimeSlot newSlot = lockSlot(newSlotId);
        if (!newSlot.getDoctor().getUserId().equals(a.getDoctor().getUserId())) {
            throw new BadRequestException("You can only move to another time with the same doctor. "
                + "To see a different doctor, cancel this appointment and book a new one.");
        }
        requireBookable(newSlot, false);
        requireNoClash(a.getPatient().getUserId(), newSlot, ctx.me().is(UserRole.PATIENT));

        LocalDate previousDate = a.getAppointmentDate();
        if (oldSlot != null) releaseSlot(oldSlot);
        newSlot.setStatus(SlotStatus.BOOKED);
        a.setSlot(newSlot);
        a.setAppointmentDate(newSlot.getStartTime().toLocalDate());
        a.setAppointmentStatus(BOOKED);   // a new time needs to be confirmed again
        Appointment saved = appointmentRepository.saveAndFlush(a);
        events.publish(AppointmentEvent.rescheduled(saved.getAppointmentId(), saved.getDoctor().getUserId(), previousDate));
        return toResponse(saved, ctx);
    }

    @Override
    public int cancelUpcomingForDoctor(String doctorId) {
        List<Appointment> upcoming = appointmentRepository
            .findByDoctor_UserIdAndAppointmentStatusInAndSlot_StartTimeAfter(doctorId, CHANGEABLE, LocalDateTime.now());
        for (Appointment a : upcoming) {
            cancel(a);   // the doctor is no longer active, so the slot is withdrawn, not reopened
            appointmentRepository.saveAndFlush(a);
            // Observers: queue entry removed, bill voided/refunded, patient told why, audit log.
            events.publish(AppointmentEvent.of(AppointmentEventType.CANCELLED, a.getAppointmentId()));
        }
        return upcoming.size();
    }

    /** Status (BOOKED/CONFIRMED), the slot not started yet, and — for patients — before the cutoff. */
    private void requireChangeAllowed(Appointment a, Context ctx, String verb) {
        if (!CHANGEABLE.contains(a.getAppointmentStatus())) {
            throw new BadRequestException("Only booked or confirmed appointments can be " + verb
                + " (this one is " + label(a.getAppointmentStatus()) + ")");
        }
        LocalDateTime start = a.getSlot() != null ? a.getSlot().getStartTime() : null;
        if (start != null && !start.isAfter(ctx.now())) {
            throw new BadRequestException("This appointment has already started and can no longer be " + verb);
        }
        if (ctx.me().is(UserRole.PATIENT) && start != null && !ctx.now().isBefore(deadline(start, ctx))) {
            throw new BadRequestException("Appointments can't be " + verb + " less than "
                + hours(ctx.cutoffHours()) + " before the start time. Please contact the front desk.");
        }
    }

    private void cancel(Appointment a) {
        a.setAppointmentStatus(CANCELLED);
        if (a.getSlot() != null) releaseSlot(a.getSlot());
    }

    /** Frees a slot for others; a slot in the past, or of a doctor no longer active, is withdrawn instead. */
    private void releaseSlot(TimeSlot slot) {
        TimeSlot locked = lockSlot(slot.getSlotId());
        if (locked.getStatus() != SlotStatus.BOOKED) return;
        boolean reusable = locked.getStartTime().isAfter(LocalDateTime.now())
            && locked.getDoctor().getAccountStatus() == AccountStatus.ACTIVE;
        locked.setStatus(reusable ? SlotStatus.AVAILABLE : SlotStatus.CANCELLED);
    }

    // ── status changes ───────────────────────────────────────────────────────

    @Override
    public AppointmentResponse updateStatus(Long appointmentId, String status) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentWrite(a);
        AppointmentStatus target;
        try {
            target = AppointmentStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid appointment status: " + status);
        }
        Context ctx = context();
        AppointmentStatus current = a.getAppointmentStatus();
        if (target == current) return toResponse(a, ctx);

        if (!TRANSITIONS.get(current).contains(target)) {
            throw new BadRequestException("Cannot change an appointment from " + label(current) + " to " + label(target));
        }
        if (ctx.me().is(UserRole.DOCTOR) && !DOCTOR_TARGETS.contains(target)) {
            throw new ForbiddenException("Access denied: doctors can mark appointments In Progress, Completed or No Show");
        }
        String timingProblem = timingProblem(a, target, ctx.now());
        if (timingProblem != null) throw new BadRequestException(timingProblem);

        if (target == CANCELLED) {
            cancel(a);   // same as the Cancel button: the slot is freed
        } else {
            a.setAppointmentStatus(target);
        }
        Appointment saved = appointmentRepository.saveAndFlush(a);
        events.publish(AppointmentEvent.of(AppointmentEventType.STATUS_CHANGED, saved.getAppointmentId()));
        return toResponse(saved, ctx);
    }

    // ── priority ─────────────────────────────────────────────────────────────

    @Override
    public AppointmentResponse updatePriority(Long appointmentId, String priority) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentWrite(a);
        if (!LIVE.contains(a.getAppointmentStatus())) {
            throw new BadRequestException("Priority can only be changed for booked, confirmed or in-progress appointments");
        }
        a.setPriority(parsePriority(priority));
        Appointment saved = appointmentRepository.saveAndFlush(a);
        events.publish(AppointmentEvent.of(AppointmentEventType.PRIORITY_CHANGED, saved.getAppointmentId()));   // queue reorders
        return toResponse(saved, context());
    }

    /** Visits can't be started, completed or marked as a no-show before the appointment's day. */
    private static String timingProblem(Appointment a, AppointmentStatus target, LocalDateTime now) {
        if ((target == IN_PROGRESS || target == COMPLETED || target == NO_SHOW)
                && a.getAppointmentDate() != null && a.getAppointmentDate().isAfter(now.toLocalDate())) {
            return "This appointment is on " + a.getAppointmentDate() + "; that can't be recorded before that day";
        }
        return null;
    }

    // ── slot checks and alternates ───────────────────────────────────────────

    private TimeSlot lockSlot(Long slotId) {
        return timeSlotRepository.findByIdForUpdate(slotId)
            .orElseThrow(() -> new ResourceNotFoundException("Time slot not found: " + slotId));
    }

    /** Throws with alternates if the slot can't be booked (taken, in the past, or doctor unavailable). */
    private void requireBookable(TimeSlot slot, boolean includeDepartment) {
        Doctor doctor = slot.getDoctor();
        if (doctor.getAccountStatus() != AccountStatus.ACTIVE) {
            // Only other doctors in the department make sense as alternates here.
            throw new SlotUnavailableException(doctor.getName() + " is not taking appointments.",
                findAlternates(slot, true, false));
        }
        String problem = null;
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            problem = "That time slot has just been taken.";
        } else if (!slot.getStartTime().isAfter(LocalDateTime.now())) {
            problem = "That time slot is in the past.";
        }
        if (problem != null) {
            List<AlternateSlot> alternates = findAlternates(slot, includeDepartment, true);
            throw new SlotUnavailableException(problem + (alternates.isEmpty()
                ? " No other open slots were found."
                : " Here are the nearest open slots."), alternates);
        }
    }

    private void requireNoClash(String patientId, TimeSlot slot, boolean byPatient) {
        if (appointmentRepository.existsByPatient_UserIdAndAppointmentStatusInAndSlot_StartTimeLessThanAndSlot_EndTimeGreaterThan(
                patientId, LIVE, slot.getEndTime(), slot.getStartTime())) {
            throw new DuplicateResourceException((byPatient ? "You already have" : "This patient already has")
                + " another appointment at this time");
        }
    }

    /**
     * Up to 3 open slots of the same doctor, then up to 3 of other active doctors in the same
     * department, starting from the day that was asked for.
     */
    private List<AlternateSlot> findAlternates(TimeSlot requested, boolean includeDepartment, boolean includeSameDoctor) {
        Doctor doctor = requested.getDoctor();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayStart = requested.getStartTime().toLocalDate().atStartOfDay();
        LocalDateTime from = dayStart.isAfter(now) ? dayStart : now;
        String deptName = doctor.getDepartment() != null ? doctor.getDepartment().getDepartmentName() : null;

        List<AlternateSlot> results = new ArrayList<>();
        if (includeSameDoctor) {
            timeSlotRepository.findTop3ByDoctor_UserIdAndStatusAndStartTimeAfterOrderByStartTimeAsc(
                    doctor.getUserId(), SlotStatus.AVAILABLE, from).stream()
                .filter(s -> !s.getSlotId().equals(requested.getSlotId()))
                .forEach(s -> results.add(toAlternate(s, doctor, deptName, "same_doctor")));
        }
        if (includeDepartment && doctor.getDepartment() != null) {
            timeSlotRepository
                .findTop3ByDoctor_Department_DepartmentIdAndDoctor_UserIdNotAndDoctor_AccountStatusAndStatusAndStartTimeAfterOrderByStartTimeAsc(
                    doctor.getDepartment().getDepartmentId(), doctor.getUserId(), AccountStatus.ACTIVE,
                    SlotStatus.AVAILABLE, from)
                .forEach(s -> results.add(toAlternate(s, s.getDoctor(), deptName, "same_department")));
        }
        return results;
    }

    private static AlternateSlot toAlternate(TimeSlot slot, Doctor doc, String deptName, String reason) {
        return new AlternateSlot(slot.getSlotId(), doc.getUserId(), doc.getName(), deptName,
            slot.getStartTime(), slot.getEndTime(), reason);
    }

    // ── mapping ──────────────────────────────────────────────────────────────

    /** Per-request facts used to work out what the current user may do. */
    private record Context(AuthenticatedUser me, LocalDateTime now, int cutoffHours) {}

    private Context context() {
        return new Context(currentUser.get(), LocalDateTime.now(), slotService.getSettings().changeCutoffHours());
    }

    private static final Comparator<AppointmentResponse> EARLIEST_FIRST = Comparator.comparing(
        AppointmentServiceImpl::sortKey, Comparator.nullsLast(Comparator.naturalOrder()));
    private static final Comparator<AppointmentResponse> NEWEST_FIRST = Comparator.comparing(
        AppointmentServiceImpl::sortKey, Comparator.nullsLast(Comparator.reverseOrder()));

    private static LocalDateTime sortKey(AppointmentResponse r) {
        if (r.getStartTime() != null) return r.getStartTime();
        return r.getAppointmentDate() != null ? r.getAppointmentDate().atStartOfDay() : null;
    }

    private List<AppointmentResponse> toResponses(List<Appointment> appointments, Comparator<AppointmentResponse> order) {
        Context ctx = context();
        List<Long> ids = appointments.stream().map(Appointment::getAppointmentId).toList();
        Set<Long> withPrescription = ids.isEmpty() ? Set.of()
            : new HashSet<>(prescriptionRepository.findAppointmentIdsWithPrescription(ids));
        return appointments.stream()
            .map(a -> withPrescription(toResponse(a, ctx, false), withPrescription.contains(a.getAppointmentId())))
            .sorted(order).toList();
    }

    private static AppointmentResponse withPrescription(AppointmentResponse r, boolean has) {
        r.setHasPrescription(has);
        return r;
    }

    private AppointmentResponse toResponse(Appointment a, Context ctx) {
        return toResponse(a, ctx, true);
    }

    private AppointmentResponse toResponse(Appointment a, Context ctx, boolean lookUpPrescription) {
        AppointmentResponse r = new AppointmentResponse();
        if (lookUpPrescription && a.getAppointmentId() != null) {
            r.setHasPrescription(prescriptionRepository.existsByAppointment_AppointmentId(a.getAppointmentId()));
        }
        r.setAppointmentId(a.getAppointmentId());
        r.setPatientId(a.getPatient().getUserId());
        r.setPatientName(a.getPatient().getName());
        Doctor d = a.getDoctor();
        r.setDoctorId(d.getUserId());
        r.setDoctorName(d.getName());
        r.setDoctorSpecialization(d.getSpecialization());
        if (d.getDepartment() != null) r.setDepartmentName(d.getDepartment().getDepartmentName());
        if (a.getSlot() != null) {
            r.setSlotId(a.getSlot().getSlotId());
            r.setStartTime(a.getSlot().getStartTime());
            r.setEndTime(a.getSlot().getEndTime());
            r.setChangeDeadline(deadline(a.getSlot().getStartTime(), ctx));
        }
        r.setAppointmentDate(a.getAppointmentDate());
        r.setBookingTime(a.getBookingTime());
        r.setReasonForVisit(a.getReasonForVisit());
        r.setStatus(a.getAppointmentStatus());
        r.setPriority(a.getPriority());

        boolean changeable = isChangeable(a, ctx);
        r.setCanCancel(changeable);
        r.setCanReschedule(changeable);
        r.setAllowedStatuses(allowedStatuses(a, ctx));
        return r;
    }

    private boolean isChangeable(Appointment a, Context ctx) {
        AuthenticatedUser me = ctx.me();
        if (!CHANGEABLE.contains(a.getAppointmentStatus())) return false;
        LocalDateTime start = a.getSlot() != null ? a.getSlot().getStartTime() : null;
        if (start != null && !start.isAfter(ctx.now())) return false;
        if (me.isStaff()) return true;
        return me.is(UserRole.PATIENT)
            && me.userId().equals(a.getPatient().getUserId())
            && (start == null || ctx.now().isBefore(deadline(start, ctx)));
    }

    private List<AppointmentStatus> allowedStatuses(Appointment a, Context ctx) {
        AuthenticatedUser me = ctx.me();
        boolean treatingDoctor = me.is(UserRole.DOCTOR) && me.userId().equals(a.getDoctor().getUserId());
        if (!me.isStaff() && !treatingDoctor) return List.of();
        return TRANSITIONS.get(a.getAppointmentStatus()).stream()
            .filter(t -> !treatingDoctor || DOCTOR_TARGETS.contains(t))
            .filter(t -> timingProblem(a, t, ctx.now()) == null)
            .sorted()
            .toList();
    }

    private static LocalDateTime deadline(LocalDateTime start, Context ctx) {
        return start.minusHours(ctx.cutoffHours());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Appointment find(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }

    private Priority parsePriority(String s) {
        if (s == null || s.isBlank()) return Priority.NORMAL;
        try {
            return Priority.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority: " + s + " (allowed: NORMAL, HIGH_PRIORITY)");
        }
    }

    private static String label(AppointmentStatus s) {
        String text = s.name().replace('_', ' ').toLowerCase(Locale.ROOT);
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }

    private static String hours(int h) { return h == 1 ? "1 hour" : h + " hours"; }

    private static String trimToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
