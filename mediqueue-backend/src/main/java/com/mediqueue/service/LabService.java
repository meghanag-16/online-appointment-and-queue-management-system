package com.mediqueue.service;

import com.mediqueue.dto.LabReportResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface LabService {
    LabReportResponse upload(Long appointmentId, MultipartFile file, String remarks);
    List<LabReportResponse> getReportsForAppointment(Long appointmentId);
    List<LabReportResponse> getAllReports();
}
