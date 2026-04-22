package com.mediqueue.controller;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Prescription;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.VirtualQueue;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.QueueStatus;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.repository.VirtualQueueRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final VirtualQueueRepository virtualQueueRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final TimeSlotRepository timeSlotRepository;

    public DoctorController(DoctorRepository doctorRepository,
                            AppointmentRepository appointmentRepository,
                            VirtualQueueRepository virtualQueueRepository,
                            PrescriptionRepository prescriptionRepository,
                            TimeSlotRepository timeSlotRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.virtualQueueRepository = virtualQueueRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    @GetMapping("/doctors/{doctorId}/slots")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getAvailableSlots(@PathVariable String doctorId) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<TimeSlot> slots = timeSlotRepository.findByDoctor_UserIdAndStatusAndStartTimeAfter(
                doctorId, SlotStatus.AVAILABLE, now);

        List<Map<String, Object>> response = slots.stream().map(slot -> {
            Map<String, Object> item = new HashMap<>();
            item.put("slotId", slot.getSlotId());
            item.put("startTime", slot.getStartTime().toString());
            item.put("endTime", slot.getEndTime().toString());
            item.put("status", slot.getStatus());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctors/search")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> searchDoctors(@RequestParam(required = false) String q) {
        List<Doctor> doctors = (q == null || q.isBlank())
                ? doctorRepository.findAll()
                : doctorRepository.findBySpecializationContainingIgnoreCase(q);

        List<Map<String, Object>> response = doctors.stream().map(doc -> {
            Map<String, Object> item = new HashMap<>();
            item.put("userId", doc.getUserId());
            item.put("name", doc.getName());
            item.put("specialization", doc.getSpecialization());
            item.put("qualification", doc.getQualification());
            item.put("consultationFee", doc.getConsultationFee());
            item.put("email", doc.getEmail());
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor/dashboard/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> getDoctorDashboard(@PathVariable String doctorId) {
        List<Appointment> appointments = appointmentRepository.findByDoctor_UserId(doctorId);
        LocalDate today = LocalDate.now();

        long todaysAppointments = appointments.stream()
                .filter(a -> a.getAppointmentDate() != null)
                .filter(a -> a.getAppointmentDate().isEqual(today))
                .filter(a -> a.getAppointmentStatus() != AppointmentStatus.CANCELLED)
                .count();

        long completedToday = appointments.stream()
                .filter(a -> a.getAppointmentDate() != null)
                .filter(a -> a.getAppointmentDate().isEqual(today))
                .filter(a -> a.getAppointmentStatus() == AppointmentStatus.COMPLETED)
                .count();

        long pendingPrescriptions = appointments.stream()
                .filter(a -> a.getAppointmentStatus() != AppointmentStatus.CANCELLED)
                .filter(a -> prescriptionRepository.findByAppointment_AppointmentId(a.getAppointmentId()).isEmpty())
                .count();

        long inQueue = virtualQueueRepository
                .findByDoctor_UserIdAndQueueDateOrderByQueuePositionAsc(doctorId, today).stream()
                .filter(queue -> queue.getVisitStatus() == QueueStatus.WAITING)
                .count();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("todaysAppointments", todaysAppointments);
        dashboard.put("inQueue", inQueue);
        dashboard.put("pendingPrescriptions", pendingPrescriptions);
        dashboard.put("completedToday", completedToday);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/doctor/queue/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getDoctorQueue(@PathVariable String doctorId) {
        LocalDate today = LocalDate.now();
        List<VirtualQueue> queue = virtualQueueRepository.findByDoctor_UserIdAndQueueDateOrderByQueuePositionAsc(doctorId, today);

        List<Map<String, Object>> response = queue.stream().map(entry -> {
            Map<String, Object> item = new HashMap<>();
            item.put("queueId", entry.getQueueId());
            item.put("appointmentId", entry.getAppointment() != null ? entry.getAppointment().getAppointmentId() : null);
            item.put("patientName", entry.getAppointment() != null && entry.getAppointment().getPatient() != null ? entry.getAppointment().getPatient().getName() : "Unknown");
            item.put("appointmentDate", entry.getAppointment() != null ? entry.getAppointment().getAppointmentDate() : null);
            item.put("priority", entry.getAppointment() != null ? entry.getAppointment().getPriority() : null);
            item.put("queuePosition", entry.getQueuePosition());
            item.put("visitStatus", entry.getVisitStatus());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
