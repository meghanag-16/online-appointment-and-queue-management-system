package com.mediqueue.service.impl;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.AppointmentResponse.AlternateSlot;
import com.mediqueue.dto.AppointmentStatsResponse;
import com.mediqueue.dto.BookAppointmentRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.CreatedByRole;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.exception.SlotUnavailableException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.AuthenticatedUser;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.AppointmentService;
import com.mediqueue.service.BillingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Random;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final BillingService billingService;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final CurrentUserService currentUser;
    private final AccessGuard accessGuard;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  PatientRepository patientRepository,
                                  DoctorRepository doctorRepository,
                                  TimeSlotRepository timeSlotRepository,
                                  BillingService billingService,
                                  CurrentUserService currentUser,
                                  AccessGuard accessGuard) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.billingService = billingService;
        this.currentUser = currentUser;
        this.accessGuard = accessGuard;
    }

    @Override
    public AppointmentResponse bookAppointment(BookAppointmentRequest req) {
        AuthenticatedUser me = currentUser.get();

        // ── who is the patient? ─────────────────────────────────────────────
        // A patient always books for themself; the body's patientId is ignored.
        // Receptionists/administrators book on behalf of the patient they name.
        String patientId;
        if (me.is(UserRole.PATIENT)) {
            patientId = me.userId();
        } else {
            if (req.getPatientId() == null || req.getPatientId().isBlank()) {
                throw new BadRequestException("Patient is required when booking on a patient's behalf");
            }
            patientId = req.getPatientId().trim();
        }
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        Doctor doctor = doctorRepository.findById(req.getDoctorId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + req.getDoctorId()));

        TimeSlot slot = timeSlotRepository.findById(req.getSlotId())
            .orElseThrow(() -> new ResourceNotFoundException("Slot not found: " + req.getSlotId()));

        // ── slot availability check ─────────────────────────────────────────
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            List<AlternateSlot> alternates = findAlternateSlots(doctor, req.getSlotId());
            throw new SlotUnavailableException(
                "Slot " + req.getSlotId() + " is not available. " + alternates.size() + " alternate(s) suggested.");
        }

        // ── mark slot booked ────────────────────────────────────────────────
        slot.setStatus(SlotStatus.BOOKED);
        timeSlotRepository.save(slot);

        // ── create appointment ──────────────────────────────────────────────
        Appointment appointment = new Appointment();
        appointment.setAppointmentId(generateAppointmentId());
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSlot(slot);
        appointment.setAppointmentDate(req.getAppointmentDate());
        appointment.setReasonForVisit(req.getReasonForVisit());
        // Only front-desk staff may mark a booking high priority; patients are always NORMAL.
        appointment.setPriority(me.is(UserRole.PATIENT) ? Priority.NORMAL : parsePriority(req.getPriority()));
        appointment.setCreatedByRole(me.is(UserRole.PATIENT) ? CreatedByRole.PATIENT : CreatedByRole.RECEPTIONIST);
        appointment.setAppointmentStatus(AppointmentStatus.BOOKED);

        Appointment saved = appointmentRepository.save(appointment);
        billingService.generateBill(saved.getAppointmentId(), "STANDARD");
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointment(Long appointmentId) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentRead(a);
        return toResponse(a);
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
        return appointments.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsForDoctor(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        return appointmentRepository.findByDoctor_UserId(doctorId)
            .stream().map(this::toResponse).toList();
    }

    @Override
    public AppointmentResponse cancelAppointment(Long appointmentId) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentWrite(a);
        a.setAppointmentStatus(AppointmentStatus.CANCELLED);
        if (a.getSlot() != null) {
            a.getSlot().setStatus(SlotStatus.AVAILABLE);
            timeSlotRepository.save(a.getSlot());
        }
        return toResponse(appointmentRepository.save(a));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAll(LocalDate date) {
        List<Appointment> appointments = date != null
            ? appointmentRepository.findByAppointmentDate(date)
            : appointmentRepository.findAll();
        return appointments.stream().map(this::toResponse).toList();
    }

    @Override
    public AppointmentResponse updateStatus(Long appointmentId, String status) {
        Appointment a = find(appointmentId);
        accessGuard.requireAppointmentWrite(a);
        AppointmentStatus newStatus;
        try {
            newStatus = AppointmentStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid appointment status: " + status);
        }
        a.setAppointmentStatus(newStatus);
        return toResponse(appointmentRepository.save(a));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentStatsResponse getStats() {
        LocalDate today = LocalDate.now();
        return new AppointmentStatsResponse(
            appointmentRepository.countByAppointmentDate(today),
            appointmentRepository.countByAppointmentDateAndAppointmentStatus(today, AppointmentStatus.BOOKED),
            appointmentRepository.countByAppointmentDateAndAppointmentStatus(today, AppointmentStatus.COMPLETED),
            appointmentRepository.countByAppointmentDateAndAppointmentStatus(today, AppointmentStatus.CANCELLED),
            appointmentRepository.count());
    }

    // ── alternate slot suggestion logic ──────────────────────────────────────

    /**
     * Returns up to 3 alternate available slots:
     *   - first tries same doctor (future slots)
     *   - then tries other doctors in the same department
     */
    private List<AlternateSlot> findAlternateSlots(Doctor doctor, Long excludeSlotId) {
        LocalDateTime now = LocalDateTime.now();

        List<AlternateSlot> results = new java.util.ArrayList<>(timeSlotRepository
            .findByDoctor_UserIdAndStatusAndStartTimeAfter(doctor.getUserId(), SlotStatus.AVAILABLE, now)
            .stream()
            .filter(s -> !s.getSlotId().equals(excludeSlotId))
            .limit(2)
            .map(s -> toAlternateSlot(s, doctor, "same_doctor"))
            .toList());

        if (results.size() < 3 && doctor.getDepartment() != null) {
            results.addAll(timeSlotRepository
                .findByDoctor_Department_DepartmentIdAndStatusAndStartTimeAfter(
                    doctor.getDepartment().getDepartmentId(), SlotStatus.AVAILABLE, now)
                .stream()
                .filter(s -> !s.getDoctor().getUserId().equals(doctor.getUserId()))
                .filter(s -> !s.getSlotId().equals(excludeSlotId))
                .limit(3L - results.size())
                .map(s -> toAlternateSlot(s, s.getDoctor(), "same_department"))
                .toList());
        }
        return results;
    }

    private AlternateSlot toAlternateSlot(TimeSlot slot, Doctor doc, String reason) {
        return new AlternateSlot(slot.getSlotId(), doc.getUserId(), doc.getName(),
            slot.getStartTime(), slot.getEndTime(), reason);
    }

    // ── mappers & helpers ─────────────────────────────────────────────────────

    private Appointment find(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }

    private AppointmentResponse toResponse(Appointment a) {
        AppointmentResponse r = new AppointmentResponse();
        r.setAppointmentId(a.getAppointmentId());
        r.setPatientId(a.getPatient().getUserId());
        r.setPatientName(a.getPatient().getName());
        r.setDoctorId(a.getDoctor().getUserId());
        r.setDoctorName(a.getDoctor().getName());
        if (a.getSlot() != null) {
            r.setSlotId(a.getSlot().getSlotId());
            r.setStartTime(a.getSlot().getStartTime());
            r.setEndTime(a.getSlot().getEndTime());
        }
        r.setAppointmentDate(a.getAppointmentDate());
        r.setReasonForVisit(a.getReasonForVisit());
        r.setStatus(a.getAppointmentStatus());
        r.setPriority(a.getPriority());
        return r;
    }

    private Priority parsePriority(String s) {
        if (s == null || s.isBlank()) return Priority.NORMAL;
        try {
            return Priority.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority: " + s + " (allowed: NORMAL, HIGH_PRIORITY)");
        }
    }

    private Long generateAppointmentId() {
        // Timestamp-based ID; to be replaced by an auto-increment key.
        return System.currentTimeMillis() + new Random().nextInt(1000);
    }
}
