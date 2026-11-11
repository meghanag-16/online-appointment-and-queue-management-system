package com.mediqueue.service.impl;

import com.mediqueue.dto.ComplaintRequest;
import com.mediqueue.dto.ComplaintResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Complaint;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.ComplaintService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final CurrentUserService currentUser;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository,
                                PatientRepository patientRepository,
                                AppointmentRepository appointmentRepository,
                                CurrentUserService currentUser) {
        this.complaintRepository = complaintRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.currentUser = currentUser;
    }

    @Override
    public ComplaintResponse raise(ComplaintRequest req) {
        // The complaint always belongs to the logged-in patient (it used to be reassigned
        // to whichever patient owned the appointment ID typed into the form).
        Patient patient = patientRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ForbiddenException("Only patients can raise complaints"));

        if (req.appointmentId() != null && !req.appointmentId().isBlank()) {
            Long appointmentId;
            try {
                appointmentId = Long.valueOf(req.appointmentId().trim());
            } catch (NumberFormatException e) {
                throw new BadRequestException("Invalid appointment ID: " + req.appointmentId());
            }
            Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
            if (!patient.getUserId().equals(appointment.getPatient().getUserId())) {
                throw new ForbiddenException("Access denied: that appointment is not yours");
            }
        }

        Complaint complaint = new Complaint();
        complaint.setComplaintId("CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        complaint.setPatient(patient);
        complaint.setIssueType(req.issueType() == null || req.issueType().isBlank() ? "General" : req.issueType().trim());
        complaint.setDescription(req.description().trim());
        complaint.setResolutionStatus(ResolutionStatus.OPEN);
        return ComplaintResponse.from(complaintRepository.save(complaint));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getAll() {
        return complaintRepository.findAll().stream().map(ComplaintResponse::from).toList();
    }

    @Override
    public ComplaintResponse resolve(String complaintId, String resolution) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + complaintId));
        complaint.setResolutionStatus(ResolutionStatus.RESOLVED);
        String note = resolution == null || resolution.isBlank() ? "Resolved by administrator" : resolution.trim();
        return ComplaintResponse.from(complaintRepository.save(complaint), note);
    }
}
