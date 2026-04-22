package com.mediqueue.controller;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Complaint;
import com.mediqueue.entity.Doctor;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.DoctorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final ComplaintRepository complaintRepository;

    public DashboardController(DoctorRepository doctorRepository,
                              AppointmentRepository appointmentRepository,
                              ComplaintRepository complaintRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.complaintRepository = complaintRepository;
    }

    @GetMapping("/doctors")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @GetMapping("/complaints")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintRepository.findAll());
    }
}
