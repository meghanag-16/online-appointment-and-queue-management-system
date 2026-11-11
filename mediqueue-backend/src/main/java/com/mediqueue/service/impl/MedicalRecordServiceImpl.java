package com.mediqueue.service.impl;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.MedicalRecord;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.Prescription;
import com.mediqueue.repository.MedicalRecordRepository;
import com.mediqueue.repository.PatientRepository;
import com.mediqueue.service.MedicalRecordService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private static final DateTimeFormatter DAY =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final MedicalRecordRepository recordRepository;
    private final PatientRepository patientRepository;

    public MedicalRecordServiceImpl(
            MedicalRecordRepository recordRepository, PatientRepository patientRepository) {
        this.recordRepository = recordRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public MedicalRecord ensureRecord(Patient patient) {
        return recordRepository
                .findByPatient_UserId(patient.getUserId())
                .orElseGet(
                        () -> {
                            MedicalRecord record = new MedicalRecord();
                            record.setPatient(patient);
                            return recordRepository.save(record);
                        });
    }

    @Override
    public int createMissingRecords() {
        int created = 0;
        for (Patient p : patientRepository.findPatientsWithoutMedicalRecord()) {
            ensureRecord(p);
            created++;
        }
        return created;
    }

    @Override
    public void appendConsultation(Prescription prescription) {
        Appointment a = prescription.getAppointment();
        MedicalRecord record = ensureRecord(a.getPatient());
        LocalDate day = a.getAppointmentDate() != null ? a.getAppointmentDate() : LocalDate.now();
        String header = day.format(DAY) + " · " + a.getDoctor().getName();

        record.setDiagnoses(
                append(record.getDiagnoses(), header + ": " + prescription.getDiagnosisNotes()));

        StringBuilder obs =
                new StringBuilder(header)
                        .append(": Medications — ")
                        .append(prescription.getMedicationList());
        if (prescription.getAdvice() != null && !prescription.getAdvice().isBlank()) {
            obs.append(". Advice — ").append(prescription.getAdvice().trim());
        }
        if (prescription.getFollowUpDate() != null) {
            obs.append(". Follow-up on ").append(prescription.getFollowUpDate().format(DAY));
        }
        record.setObservations(append(record.getObservations(), obs.toString()));
        recordRepository.save(record);
    }

    /** Newest entry last, one per line. */
    private static String append(String existing, String line) {
        return existing == null || existing.isBlank() ? line : existing + "\n" + line;
    }
}
