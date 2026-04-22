package com.mediqueue.controller;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Complaint;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    public ComplaintController(ComplaintRepository complaintRepository,
                               UserRepository userRepository,
                               AppointmentRepository appointmentRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Map<String, Object>> raiseComplaint(@RequestBody Map<String, String> payload) {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Patient patient = (Patient) userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        Complaint complaint = new Complaint();
        complaint.setComplaintId("CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        complaint.setPatient(patient);
        complaint.setIssueType(payload.getOrDefault("issueType", "General"));
        complaint.setDescription(payload.getOrDefault("description", ""));
        complaint.setResolutionStatus(ResolutionStatus.OPEN);

        String appointmentId = payload.get("appointmentId");
        if (appointmentId != null && !appointmentId.isBlank()) {
            try {
                Appointment appointment = appointmentRepository.findById(Long.valueOf(appointmentId)).orElse(null);
                if (appointment != null) {
                    complaint.setPatient(appointment.getPatient());
                }
            } catch (NumberFormatException ignored) {}
        }

        complaintRepository.save(complaint);
        Map<String, Object> created = new HashMap<>();
        created.put("complaintId", complaint.getComplaintId());
        created.put("status", complaint.getResolutionStatus().name());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getAllComplaints() {
        List<Map<String, Object>> response = complaintRepository.findAll().stream().map(complaint -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", complaint.getComplaintId());
            item.put("issueType", complaint.getIssueType());
            item.put("description", complaint.getDescription());
            item.put("status", complaint.getResolutionStatus().name());
            item.put("createdOn", complaint.getCreatedOn());
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{complaintId}/resolve")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> resolveComplaint(@PathVariable String complaintId,
                                                                @RequestBody Map<String, String> payload) {
        Complaint complaint = complaintRepository.findById(complaintId).orElse(null);
        if (complaint == null) {
            Map<String, Object> notFound = new HashMap<>();
            notFound.put("error", "Complaint not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(notFound);
        }
        complaint.setResolutionStatus(ResolutionStatus.RESOLVED);
        complaintRepository.save(complaint);
        Map<String, Object> resolved = new HashMap<>();
        resolved.put("id", complaint.getComplaintId());
        resolved.put("status", complaint.getResolutionStatus().name());
        resolved.put("resolution", payload.getOrDefault("resolution", "Resolved by administrator"));
        return ResponseEntity.ok(resolved);
    }
}
