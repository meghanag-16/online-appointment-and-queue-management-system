package com.mediqueue.service;

import com.mediqueue.dto.MedicalRecordResponse;
import com.mediqueue.dto.PatientDashboardResponse;

public interface PatientService {
    PatientDashboardResponse getDashboard(String patientId);
    MedicalRecordResponse getMedicalRecord(String patientId);
}
