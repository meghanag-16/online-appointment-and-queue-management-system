package com.mediqueue.service.impl;

import com.mediqueue.dto.MedicalRecordResponse;
import com.mediqueue.dto.PatientDashboardResponse;
import com.mediqueue.dto.PatientHistoryResponse;
import com.mediqueue.dto.PatientSummaryDTO;
import com.mediqueue.entity.MedicalRecord;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.LabReportRepository;
import com.mediqueue.repository.MedicalRecordRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.AppointmentService;
import com.mediqueue.service.PatientService;
import com.mediqueue.service.PrescriptionService;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PatientServiceImpl implements PatientService {

    private static final String NO_DIAGNOSES = "No diagnoses recorded yet.";
    private static final String NO_OBSERVATIONS = "No observations recorded yet.";

    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final ComplaintRepository complaintRepository;
    private final LabReportRepository labReportRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AccessGuard accessGuard;
    private final PatientRepository patientRepository;
    private final PrescriptionService prescriptionService;
    private final AppointmentService appointmentService;

    public PatientServiceImpl(
            AppointmentRepository appointmentRepository,
            BillRepository billRepository,
            ComplaintRepository complaintRepository,
            LabReportRepository labReportRepository,
            MedicalRecordRepository medicalRecordRepository,
            AccessGuard accessGuard,
            PatientRepository patientRepository,
            PrescriptionService prescriptionService,
            AppointmentService appointmentService) {
        this.appointmentRepository = appointmentRepository;
        this.billRepository = billRepository;
        this.complaintRepository = complaintRepository;
        this.labReportRepository = labReportRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.accessGuard = accessGuard;
        this.patientRepository = patientRepository;
        this.prescriptionService = prescriptionService;
        this.appointmentService = appointmentService;
    }

    @Override
    public PatientHistoryResponse getHistory(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        Patient p =
                patientRepository
                        .findById(patientId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Patient not found: " + patientId));
        MedicalRecord record = medicalRecordRepository.findByPatient_UserId(patientId).orElse(null);
        Integer age =
                p.getDateOfBirth() != null
                        ? Period.between(p.getDateOfBirth(), LocalDate.now()).getYears()
                        : null;
        return new PatientHistoryResponse(
                p.getUserId(),
                p.getName(),
                p.getGender(),
                p.getDateOfBirth(),
                age,
                p.getPhoneNumber(),
                p.getBloodGroup(),
                p.getAllergies(),
                p.getChronicConditions(),
                p.getEmergencyContact(),
                record != null && record.getDiagnoses() != null
                        ? record.getDiagnoses()
                        : NO_DIAGNOSES,
                record != null && record.getObservations() != null
                        ? record.getObservations()
                        : NO_OBSERVATIONS,
                prescriptionService.getByPatient(patientId),
                appointmentService.getAppointmentsForPatient(patientId));
    }

    @Override
    public List<PatientSummaryDTO> searchPatients(String query) {
        String text = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String term = "%" + text.replace("%", "").replace("_", "") + "%";
        return patientRepository.search(term, AccountStatus.ACTIVE, PageRequest.of(0, 20)).stream()
                .map(PatientSummaryDTO::from)
                .toList();
    }

    @Override
    public PatientDashboardResponse getDashboard(String patientId) {
        accessGuard.requireSelfOrStaff(patientId);
        return new PatientDashboardResponse(
                appointmentRepository
                        .countByPatient_UserIdAndAppointmentDateGreaterThanEqualAndAppointmentStatusIn(
                                patientId,
                                LocalDate.now(),
                                List.of(
                                        AppointmentStatus.BOOKED,
                                        AppointmentStatus.CONFIRMED,
                                        AppointmentStatus.IN_PROGRESS)),
                billRepository.countByAppointment_Patient_UserIdAndPaymentStatusIn(
                        patientId, List.of(PaymentStatus.PENDING, PaymentStatus.FAILED)),
                labReportRepository.countByAppointment_Patient_UserId(patientId),
                complaintRepository.countByPatient_UserIdAndResolutionStatusIn(
                        patientId, List.of(ResolutionStatus.OPEN, ResolutionStatus.UNDER_REVIEW)));
    }

    @Override
    public MedicalRecordResponse getMedicalRecord(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        return medicalRecordRepository
                .findByPatient_UserId(patientId)
                .map(
                        r ->
                                new MedicalRecordResponse(
                                        r.getRecordId() != null ? r.getRecordId().toString() : "",
                                        r.getDiagnoses() != null ? r.getDiagnoses() : NO_DIAGNOSES,
                                        r.getObservations() != null
                                                ? r.getObservations()
                                                : NO_OBSERVATIONS))
                .orElseGet(() -> new MedicalRecordResponse("", NO_DIAGNOSES, NO_OBSERVATIONS));
    }
}
