package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.ComplaintRequest;
import com.mediqueue.dto.ComplaintResponse;
import com.mediqueue.dto.ComplaintStatusRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Bill;
import com.mediqueue.entity.Complaint;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.ComplaintService;
import com.mediqueue.service.facade.NotificationFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final CurrentUserService currentUser;
    private final NotificationFacade notificationFacade;
    private final AuditService auditService;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository,
                                PatientRepository patientRepository,
                                AppointmentRepository appointmentRepository,
                                BillRepository billRepository,
                                CurrentUserService currentUser,
                                NotificationFacade notificationFacade,
                                AuditService auditService) {
        this.complaintRepository = complaintRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.billRepository = billRepository;
        this.currentUser = currentUser;
        this.notificationFacade = notificationFacade;
        this.auditService = auditService;
    }

    /** The only allowed moves. RESOLVED is final. */
    public static boolean canMove(ResolutionStatus from, ResolutionStatus to) {
        return (from == ResolutionStatus.OPEN && to == ResolutionStatus.UNDER_REVIEW)
            || (from == ResolutionStatus.UNDER_REVIEW && to == ResolutionStatus.RESOLVED);
    }

    @Override
    public ComplaintResponse raise(ComplaintRequest req) {
        // The complaint always belongs to the logged-in patient.
        Patient patient = patientRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ForbiddenException("Only patients can raise complaints"));

        Appointment appointment = null;
        Long appointmentId = parseId(req.appointmentId(), "appointment");
        if (appointmentId != null) {
            appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
            if (!patient.getUserId().equals(appointment.getPatient().getUserId())) {
                throw new ForbiddenException("Access denied: that appointment is not yours");
            }
        }
        Bill bill = null;
        Long billId = parseId(req.billId(), "bill");
        if (billId != null) {
            bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));
            if (!patient.getUserId().equals(bill.getAppointment().getPatient().getUserId())) {
                throw new ForbiddenException("Access denied: that bill is not yours");
            }
            if (appointment == null) appointment = bill.getAppointment();   // a bill always belongs to one visit
        }

        Complaint complaint = new Complaint();
        complaint.setComplaintId("CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        complaint.setPatient(patient);
        complaint.setAppointment(appointment);
        complaint.setBill(bill);
        complaint.setIssueType(req.issueType() == null || req.issueType().isBlank() ? "General" : req.issueType().trim());
        complaint.setDescription(req.description().trim());
        complaint.setResolutionStatus(ResolutionStatus.OPEN);
        complaint.setUpdatedAt(LocalDateTime.now());
        Complaint saved = complaintRepository.save(complaint);
        auditService.record(AuditAction.COMPLAINT_RAISED, "COMPLAINT", saved.getComplaintId(),
            saved.getIssueType() + (appointment != null ? ", appointment #" + appointment.getAppointmentId() : "")
                + (bill != null ? ", bill #" + bill.getBillId() : ""));
        return ComplaintResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMine() {
        return complaintRepository.findByPatient_UserIdOrderByCreatedOnDescUpdatedAtDesc(currentUser.userId())
            .stream().map(ComplaintResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getAll(String status) {
        List<Complaint> list = status == null || status.isBlank()
            ? complaintRepository.findAllByOrderByCreatedOnDescUpdatedAtDesc()
            : complaintRepository.findByResolutionStatusOrderByCreatedOnDescUpdatedAtDesc(parseStatus(status));
        return list.stream().map(ComplaintResponse::from).toList();
    }

    @Override
    public ComplaintResponse updateStatus(String complaintId, ComplaintStatusRequest req) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + complaintId));
        ResolutionStatus target = parseStatus(req.status());
        ResolutionStatus current = complaint.getResolutionStatus();
        if (!canMove(current, target)) {
            throw new BadRequestException(current == ResolutionStatus.RESOLVED
                ? "This complaint is already resolved"
                : "A complaint goes Open → Under review → Resolved; it can't move from "
                    + label(current) + " to " + label(target));
        }
        String note = req.note() == null || req.note().isBlank() ? null : req.note().trim();
        if (target == ResolutionStatus.RESOLVED && note == null) {
            throw new BadRequestException("Write a resolution note before resolving: the patient will see it");
        }
        complaint.setResolutionStatus(target);
        if (note != null) complaint.setResolutionNote(note);
        complaint.setUpdatedAt(LocalDateTime.now());
        if (target == ResolutionStatus.RESOLVED) complaint.setResolvedAt(LocalDateTime.now());
        Complaint saved = complaintRepository.save(complaint);

        String message = target == ResolutionStatus.RESOLVED
            ? "Your complaint " + complaintId + " has been resolved: " + note
            : "Your complaint " + complaintId + " is now under review.";
        notificationFacade.generalAlert(saved.getPatient(), message, null);
        auditService.record(AuditAction.COMPLAINT_STATUS_CHANGED, "COMPLAINT", complaintId,
            label(current) + " → " + label(target) + (note != null ? ": " + note : ""));
        return ComplaintResponse.from(saved);
    }

    private static Long parseId(String raw, String what) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Long.valueOf(raw.trim().replaceFirst("^#", ""));
        } catch (NumberFormatException e) {
            throw new BadRequestException("Invalid " + what + " number: " + raw);
        }
    }

    private static ResolutionStatus parseStatus(String status) {
        try {
            return ResolutionStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid complaint status: " + status + " (allowed: OPEN, UNDER_REVIEW, RESOLVED)");
        }
    }

    private static String label(ResolutionStatus s) {
        return switch (s) {
            case OPEN -> "Open";
            case UNDER_REVIEW -> "Under review";
            case RESOLVED -> "Resolved";
        };
    }
}
