package com.mediqueue.service.impl;

import com.mediqueue.dto.MedicalRecordResponse;
import com.mediqueue.dto.PatientDashboardResponse;
import com.mediqueue.dto.PatientSummaryDTO;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.repository.PatientRepository;
import org.springframework.data.domain.PageRequest;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.LabReportRepository;
import com.mediqueue.repository.MedicalRecordRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.PatientService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

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

    public PatientServiceImpl(AppointmentRepository appointmentRepository,
                              BillRepository billRepository,
                              ComplaintRepository complaintRepository,
                              LabReportRepository labReportRepository,
                              MedicalRecordRepository medicalRecordRepository,
                              AccessGuard accessGuard,
                              PatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.billRepository = billRepository;
        this.complaintRepository = complaintRepository;
        this.labReportRepository = labReportRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.accessGuard = accessGuard;
        this.patientRepository = patientRepository;
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
            appointmentRepository.countByPatient_UserIdAndAppointmentDateGreaterThanEqualAndAppointmentStatusIn(
                patientId, LocalDate.now(),
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS)),
            billRepository.countByAppointment_Patient_UserIdAndPaymentStatusIn(
                patientId, List.of(PaymentStatus.PENDING, PaymentStatus.FAILED)),
            labReportRepository.countByAppointment_Patient_UserId(patientId),
            complaintRepository.countByPatient_UserIdAndResolutionStatusIn(
                patientId, List.of(ResolutionStatus.OPEN, ResolutionStatus.UNDER_REVIEW)));
    }

    @Override
    public MedicalRecordResponse getMedicalRecord(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        return medicalRecordRepository.findByPatient_UserId(patientId)
            .map(r -> new MedicalRecordResponse(
                r.getRecordId() != null ? r.getRecordId().toString() : "",
                r.getDiagnoses() != null ? r.getDiagnoses() : NO_DIAGNOSES,
                r.getObservations() != null ? r.getObservations() : NO_OBSERVATIONS))
            .orElseGet(() -> new MedicalRecordResponse("", NO_DIAGNOSES, NO_OBSERVATIONS));
    }
}
