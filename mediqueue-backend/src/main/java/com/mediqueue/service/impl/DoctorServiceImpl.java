package com.mediqueue.service.impl;

import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorDashboardResponse;
import com.mediqueue.dto.QueueEntryResponse;
import com.mediqueue.dto.SlotResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.QueueStatus;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.repository.VirtualQueueRepository;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.DoctorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class DoctorServiceImpl implements DoctorService {

    /** Appointments that still need a prescription once seen (excludes cancelled and no-show). */
    private static final List<AppointmentStatus> PRESCRIBABLE_STATUSES = List.of(
        AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED,
        AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED);

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final VirtualQueueRepository virtualQueueRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AccessGuard accessGuard;

    public DoctorServiceImpl(DoctorRepository doctorRepository,
                             AppointmentRepository appointmentRepository,
                             VirtualQueueRepository virtualQueueRepository,
                             TimeSlotRepository timeSlotRepository,
                             AccessGuard accessGuard) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.virtualQueueRepository = virtualQueueRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.accessGuard = accessGuard;
    }

    @Override
    public List<SlotResponse> getAvailableSlots(String doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));
        if (doctor.getAccountStatus() != AccountStatus.ACTIVE) return List.of();   // cannot be booked

        LocalDateTime now = LocalDateTime.now();
        List<TimeSlot> slots = date == null
            ? timeSlotRepository.findByDoctor_UserIdAndStatusAndStartTimeAfterOrderByStartTimeAsc(
                doctorId, SlotStatus.AVAILABLE, now)
            : timeSlotRepository.findByDoctor_UserIdAndStatusAndStartTimeBetweenOrderByStartTimeAsc(
                doctorId, SlotStatus.AVAILABLE, later(now, date.atStartOfDay()), date.plusDays(1).atStartOfDay());
        return slots.stream().map(SlotResponse::from).toList();
    }

    /**
     * Every word typed must appear in the doctor's name, specialization, qualification or
     * department, ignoring case, so "cardiology", "Dr. Mehta", "arjun" and "pediatric" all work.
     * A leading "Dr"/"Dr." is ignored. Deactivated or suspended doctors are never returned.
     * Each result carries its earliest open slot (on the chosen date, if any).
     */
    @Override
    public List<DoctorDTO> searchDoctors(String query, String departmentId, LocalDate date) {
        List<String> terms = query == null ? List.of() : Arrays.stream(query.toLowerCase(Locale.ROOT).split("\\s+"))
            .map(t -> t.replaceAll("[,.]", ""))
            .filter(t -> !t.isBlank() && !t.equals("dr"))
            .toList();
        String dept = departmentId == null || departmentId.isBlank() ? null : departmentId.trim();

        // One query: earliest open slot per doctor in the window (the chosen day, or any time ahead).
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime after = date == null ? now : later(now, date.atStartOfDay());
        LocalDateTime before = date == null ? LocalDateTime.of(9999, 1, 1, 0, 0) : date.plusDays(1).atStartOfDay();
        Map<String, LocalDateTime> nextSlot = new HashMap<>();
        for (Object[] row : timeSlotRepository.earliestOpenSlotPerDoctor(SlotStatus.AVAILABLE, after, before)) {
            nextSlot.put((String) row[0], (LocalDateTime) row[1]);
        }

        return doctorRepository.findByAccountStatus(AccountStatus.ACTIVE).stream()
            .filter(d -> dept == null || (d.getDepartment() != null && dept.equals(d.getDepartment().getDepartmentId())))
            .filter(d -> date == null || nextSlot.containsKey(d.getUserId()))
            .filter(d -> {
                String haystack = String.join(" ",
                    nullToEmpty(d.getName()),
                    nullToEmpty(d.getSpecialization()),
                    nullToEmpty(d.getQualification()),
                    d.getDepartment() != null ? nullToEmpty(d.getDepartment().getDepartmentName()) : "")
                    .toLowerCase(Locale.ROOT);
                return terms.stream().allMatch(haystack::contains);
            })
            .sorted(Comparator.comparing(Doctor::getName, String.CASE_INSENSITIVE_ORDER))
            .map(d -> {
                DoctorDTO dto = DoctorDTO.from(d);
                dto.setNextAvailableSlot(nextSlot.get(d.getUserId()));
                return dto;
            })
            .toList();
    }

    private static LocalDateTime later(LocalDateTime a, LocalDateTime b) { return a.isAfter(b) ? a : b; }

    private static String nullToEmpty(String s) { return s == null ? "" : s; }

    @Override
    public DoctorDashboardResponse getDashboard(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        LocalDate today = LocalDate.now();
        return new DoctorDashboardResponse(
            appointmentRepository.countByDoctor_UserIdAndAppointmentDateAndAppointmentStatusNot(
                doctorId, today, AppointmentStatus.CANCELLED),
            virtualQueueRepository.countByDoctor_UserIdAndQueueDateAndVisitStatus(
                doctorId, today, QueueStatus.WAITING),
            // one query, and only appointments up to today (not every future booking)
            appointmentRepository.countWithoutPrescription(doctorId, today, PRESCRIBABLE_STATUSES),
            appointmentRepository.countByDoctor_UserIdAndAppointmentDateAndAppointmentStatus(
                doctorId, today, AppointmentStatus.COMPLETED));
    }

    @Override
    public List<QueueEntryResponse> getTodayQueue(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        return virtualQueueRepository
            .findByDoctor_UserIdAndQueueDateOrderByQueuePositionAsc(doctorId, LocalDate.now())
            .stream()
            .map(entry -> {
                Appointment a = entry.getAppointment();
                return new QueueEntryResponse(
                    entry.getQueueId(),
                    a != null ? a.getAppointmentId() : null,
                    a != null && a.getPatient() != null ? a.getPatient().getName() : "Unknown",
                    a != null ? a.getAppointmentDate() : null,
                    a != null ? a.getPriority() : null,
                    entry.getQueuePosition(),
                    entry.getVisitStatus());
            })
            .toList();
    }
}
