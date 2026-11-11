package com.mediqueue.service.impl;

import com.mediqueue.dto.PrescriptionRequest;
import com.mediqueue.dto.PrescriptionResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Prescription;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.PrescriptionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccessGuard accessGuard;

    public PrescriptionServiceImpl(PrescriptionRepository prescriptionRepository,
                                   AppointmentRepository appointmentRepository,
                                   AccessGuard accessGuard) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.accessGuard = accessGuard;
    }

    @Override
    public PrescriptionResponse create(PrescriptionRequest req) {
        Appointment appointment = appointmentRepository.findById(req.appointmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + req.appointmentId()));
        accessGuard.requireTreatingDoctor(appointment);

        if (prescriptionRepository.findByAppointment_AppointmentId(req.appointmentId()).isPresent()) {
            throw new DuplicateResourceException("A prescription already exists for this appointment");
        }
        Prescription prescription = new Prescription();
        prescription.setAppointment(appointment);
        prescription.setDiagnosisNotes(req.diagnosisNotes().trim());
        prescription.setMedicationList(req.medicationList().trim());
        prescription.setAdvice(req.advice());
        prescription.setFollowUpDate(req.followUpDate());
        return PrescriptionResponse.from(prescriptionRepository.save(prescription));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByDoctor(String doctorId) {
        accessGuard.requireDoctorSelfOrStaff(doctorId);
        return prescriptionRepository.findByAppointment_Doctor_UserId(doctorId).stream()
            .map(PrescriptionResponse::from).toList();
    }
}
