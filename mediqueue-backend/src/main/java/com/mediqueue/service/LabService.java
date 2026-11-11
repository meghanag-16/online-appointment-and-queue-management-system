package com.mediqueue.service;

import com.mediqueue.dto.LabAppointmentResponse;
import com.mediqueue.dto.LabReportResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface LabService {

    /** Lab technician: find appointments by appointment ID, patient ID or patient name. */
    List<LabAppointmentResponse> searchAppointments(String query);

    LabReportResponse upload(Long appointmentId, String reportType, String remarks, MultipartFile file);

    List<LabReportResponse> getReportsForAppointment(Long appointmentId);

    List<LabReportResponse> getReportsForPatient(String patientId);

    List<LabReportResponse> getAllReports();

    /** The file plus what the browser needs to save it; access is checked first. */
    Download download(Long reportId);

    record Download(Resource resource, String fileName, String contentType, long size) {}
}
