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
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.DoctorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
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
    public List<SlotResponse> getAvailableSlots(String doctorId) {
        return timeSlotRepository
            .findByDoctor_UserIdAndStatusAndStartTimeAfter(doctorId, SlotStatus.AVAILABLE, LocalDateTime.now())
            .stream()
            .sorted(Comparator.comparing(TimeSlot::getStartTime))
            .map(SlotResponse::from)
            .toList();
    }

    /**
     * Searches active doctors by name, specialization, department and qualification.
     * Every word typed must appear in one of those fields, ignoring case, so "cardiology",
     * "Dr. Mehta", "arjun" and "pediatric" all find the right doctors. A leading "Dr"/"Dr." is
     * ignored. Deactivated or suspended doctors are never returned (they cannot be booked).
     */
    @Override
    public List<DoctorDTO> searchDoctors(String query) {
        List<String> terms = query == null ? List.of() : Arrays.stream(query.toLowerCase(Locale.ROOT).split("\\s+"))
            .map(t -> t.replaceAll("[,.]", ""))
            .filter(t -> !t.isBlank() && !t.equals("dr"))
            .toList();

        return doctorRepository.findByAccountStatus(AccountStatus.ACTIVE).stream()
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
            .map(DoctorDTO::from)
            .toList();
    }

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
