package com.mediqueue.service.impl;
import com.mediqueue.service.BillingService;
import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.AppointmentResponse.AlternateSlot;
import com.mediqueue.dto.BookAppointmentRequest;
import com.mediqueue.entity.*;
import com.mediqueue.entity.enums.*;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.exception.SlotUnavailableException;
import com.mediqueue.repository.*;
import com.mediqueue.service.AppointmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final BillingService billingService;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository     patientRepository;
    private final DoctorRepository      doctorRepository;
    private final TimeSlotRepository    timeSlotRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                             PatientRepository patientRepository,
                             DoctorRepository doctorRepository,
                             TimeSlotRepository timeSlotRepository,
                             BillingService billingService) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
    this.doctorRepository = doctorRepository;
    this.timeSlotRepository = timeSlotRepository;
    this.billingService = billingService;
}

    @Override
    public AppointmentResponse bookAppointment(BookAppointmentRequest req) {

        Patient patient = patientRepository.findById(req.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + req.getPatientId()));

        Doctor doctor = doctorRepository.findById(req.getDoctorId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + req.getDoctorId()));

        TimeSlot slot = timeSlotRepository.findById(req.getSlotId())
            .orElseThrow(() -> new ResourceNotFoundException("Slot not found: " + req.getSlotId()));

        // ── slot availability check ─────────────────────────────────────────
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            // Build alternate suggestions and throw a structured response
            List<AlternateSlot> alternates = findAlternateSlots(doctor, req.getSlotId());
            AppointmentResponse unavailableResponse = new AppointmentResponse();
            unavailableResponse.setDoctorId(doctor.getUserId());
            unavailableResponse.setDoctorName(doctor.getName());
            unavailableResponse.setAlternateSlots(alternates);
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
        appointment.setPriority(parsePriority(req.getPriority()));
        appointment.setCreatedByRole(parseCreatedByRole(req.getCreatedByRole()));
        appointment.setAppointmentStatus(AppointmentStatus.BOOKED);

        Appointment saved = appointmentRepository.save(appointment);
        billingService.generateBill(saved.getAppointmentId(), "STANDARD");
        return toResponse(saved, null);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointment(Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        return toResponse(a, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsForPatient(String patientId) {
        return appointmentRepository.findByPatient_UserId(patientId)
            .stream().map(a -> toResponse(a, null)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsForDoctor(String doctorId) {
        return appointmentRepository.findByDoctor_UserId(doctorId)
            .stream().map(a -> toResponse(a, null)).collect(Collectors.toList());
    }

    @Override
    public AppointmentResponse cancelAppointment(Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        a.setAppointmentStatus(AppointmentStatus.CANCELLED);
        // free the slot
        if (a.getSlot() != null) {
            a.getSlot().setStatus(SlotStatus.AVAILABLE);
            timeSlotRepository.save(a.getSlot());
        }
        appointmentRepository.save(a);
        return toResponse(a, null);
    }

    // ── alternate slot suggestion logic ──────────────────────────────────────

    /**
     * Returns up to 3 alternate available slots:
     *   - first tries same doctor (future slots)
     *   - then tries other doctors in the same department
     */
    private List<AlternateSlot> findAlternateSlots(Doctor doctor, Long excludeSlotId) {
        LocalDateTime now = LocalDateTime.now();

        // same-doctor slots
        List<AlternateSlot> results = timeSlotRepository
            .findByDoctor_UserIdAndStatusAndStartTimeAfter(
                doctor.getUserId(), SlotStatus.AVAILABLE, now)
            .stream()
            .filter(s -> !s.getSlotId().equals(excludeSlotId))
            .limit(2)
            .map(s -> toAlternateSlot(s, doctor, "same_doctor"))
            .collect(Collectors.toList());

        // if fewer than 3, pad with same-department slots from other doctors
        if (results.size() < 3 && doctor.getDepartment() != null) {
            List<AlternateSlot> deptSlots = timeSlotRepository
                .findByDoctor_Department_DepartmentIdAndStatusAndStartTimeAfter(
                    doctor.getDepartment().getDepartmentId(), SlotStatus.AVAILABLE, now)
                .stream()
                .filter(s -> !s.getDoctor().getUserId().equals(doctor.getUserId()))
                .filter(s -> !s.getSlotId().equals(excludeSlotId))
                .limit(3L - results.size())
                .map(s -> toAlternateSlot(s, s.getDoctor(), "same_department"))
                .collect(Collectors.toList());
            results.addAll(deptSlots);
        }

        return results;
    }

    private AlternateSlot toAlternateSlot(TimeSlot slot, Doctor doc, String reason) {
        AlternateSlot alt = new AlternateSlot();
        alt.setSlotId(slot.getSlotId());
        alt.setDoctorId(doc.getUserId());
        alt.setDoctorName(doc.getName());
        alt.setStartTime(slot.getStartTime());
        alt.setEndTime(slot.getEndTime());
        alt.setReason(reason);
        return alt;
    }

    // ── mappers & helpers ─────────────────────────────────────────────────────

    private AppointmentResponse toResponse(Appointment a, List<AlternateSlot> alternates) {
        AppointmentResponse r = new AppointmentResponse();
        r.setAppointmentId(a.getAppointmentId());
        r.setPatientId(a.getPatient().getUserId());
        r.setPatientName(a.getPatient().getName());
        r.setDoctorId(a.getDoctor().getUserId());
        r.setDoctorName(a.getDoctor().getName());
        if (a.getSlot() != null) r.setSlotId(a.getSlot().getSlotId());
        r.setAppointmentDate(a.getAppointmentDate());
        r.setReasonForVisit(a.getReasonForVisit());
        r.setStatus(a.getAppointmentStatus());
        r.setPriority(a.getPriority());
        r.setAlternateSlots(alternates);
        return r;
    }

    private Priority parsePriority(String s) {
        try { return s != null ? Priority.valueOf(s.toUpperCase()) : Priority.NORMAL; }
        catch (IllegalArgumentException e) { return Priority.NORMAL; }
    }

    private CreatedByRole parseCreatedByRole(String s) {
        try { return s != null ? CreatedByRole.valueOf(s.toUpperCase()) : CreatedByRole.PATIENT; }
        catch (IllegalArgumentException e) { return CreatedByRole.PATIENT; }
    }

    private Long generateAppointmentId() {
        // Simple timestamp-based ID; replace with a sequence in production
        return System.currentTimeMillis() + new Random().nextInt(1000);
    }
}
