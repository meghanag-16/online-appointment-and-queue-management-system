package com.mediqueue.service.impl;

import com.mediqueue.dto.PrescriptionRequest;
import com.mediqueue.dto.PrescriptionResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Prescription;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.AppointmentService;
import com.mediqueue.service.MedicalRecordService;
import com.mediqueue.service.PrescriptionService;
import com.mediqueue.service.facade.NotificationFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final MedicalRecordService medicalRecordService;
    private final NotificationFacade notificationFacade;
    private final AccessGuard accessGuard;

    public PrescriptionServiceImpl(PrescriptionRepository prescriptionRepository,
                                   AppointmentRepository appointmentRepository,
                                   AppointmentService appointmentService,
                                   MedicalRecordService medicalRecordService,
                                   NotificationFacade notificationFacade,
                                   AccessGuard accessGuard) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.appointmentService = appointmentService;
        this.medicalRecordService = medicalRecordService;
        this.notificationFacade = notificationFacade;
        this.accessGuard = accessGuard;
    }

    @Override
    public PrescriptionResponse create(PrescriptionRequest req) {
        Appointment appointment = findAppointment(req.appointmentId());
        accessGuard.requireTreatingDoctor(appointment);

        if (prescriptionRepository.existsByAppointment_AppointmentId(req.appointmentId())) {
            throw new DuplicateResourceException("A prescription already exists for this appointment");
        }
        AppointmentStatus status = appointment.getAppointmentStatus();
        if (status == AppointmentStatus.CANCELLED || status == AppointmentStatus.NO_SHOW) {
            throw new BadRequestException("This appointment was " + status.name().replace('_', ' ').toLowerCase()
                + "; no prescription can be issued for it");
        }
        if (appointment.getAppointmentDate() != null && appointment.getAppointmentDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("This appointment is on " + appointment.getAppointmentDate()
                + "; a prescription can only be issued on or after the visit");
        }
        if (req.followUpDate() != null && !req.followUpDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("The follow-up date must be in the future");
        }

        Prescription prescription = new Prescription();
        prescription.setAppointment(appointment);
        prescription.setDiagnosisNotes(req.diagnosisNotes().trim());
        prescription.setMedicationList(req.medicationList().trim());
        prescription.setAdvice(req.advice() == null || req.advice().isBlank() ? null : req.advice().trim());
        prescription.setFollowUpDate(req.followUpDate());
        Prescription saved = prescriptionRepository.saveAndFlush(prescription);

        // The visit is over: walk the appointment to COMPLETED through the normal status rules, so the
        // queue (an observer of appointment changes) marks it FINISHED as well.
        if (status == AppointmentStatus.BOOKED || status == AppointmentStatus.CONFIRMED) {
            appointmentService.updateStatus(appointment.getAppointmentId(), AppointmentStatus.IN_PROGRESS.name());
        }
        if (appointment.getAppointmentStatus() != AppointmentStatus.COMPLETED) {
            appointmentService.updateStatus(appointment.getAppointmentId(), AppointmentStatus.COMPLETED.name());
        }

        medicalRecordService.appendConsultation(saved);
        notificationFacade.sendPrescriptionAvailable(appointment.getPatient().getEmail(), appointment.getPatient().getName());
        return PrescriptionResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByDoctor(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        return prescriptionRepository.findByAppointment_Doctor_UserIdOrderByIssuedAtDesc(doctorId).stream()
            .map(PrescriptionResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByPatient(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        return prescriptionRepository.findByAppointment_Patient_UserIdOrderByIssuedAtDesc(patientId).stream()
            .map(PrescriptionResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionResponse getByAppointment(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        accessGuard.requireAppointmentDocumentRead(appointment, false);   // not lab technicians
        return prescriptionRepository.findByAppointment_AppointmentId(appointmentId)
            .map(PrescriptionResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("No prescription has been issued for appointment " + appointmentId));
    }

    private Appointment findAppointment(Long id) {
        return appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
    }
}
