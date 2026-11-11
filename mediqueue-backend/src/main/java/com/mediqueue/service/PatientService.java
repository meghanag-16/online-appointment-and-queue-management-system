package com.mediqueue.service;

import com.mediqueue.dto.MedicalRecordResponse;
import com.mediqueue.dto.PatientDashboardResponse;
import com.mediqueue.dto.PatientSummaryDTO;

import java.util.List;

public interface PatientService {
    PatientDashboardResponse getDashboard(String patientId);
    MedicalRecordResponse getMedicalRecord(String patientId);
    /** Receptionist/admin patient picker: active patients matching the text (max 20). */
    List<PatientSummaryDTO> searchPatients(String query);
}
