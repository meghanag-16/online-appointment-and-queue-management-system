package com.mediqueue.service.impl;

import com.mediqueue.dto.LabReportResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.LabReport;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.LabReportRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.LabService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LabServiceImpl implements LabService {

    private final LabReportRepository labReportRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccessGuard accessGuard;
    private final Path uploadRoot = Path.of("uploads", "lab");

    public LabServiceImpl(LabReportRepository labReportRepository,
                          AppointmentRepository appointmentRepository,
                          AccessGuard accessGuard) {
        this.labReportRepository = labReportRepository;
        this.appointmentRepository = appointmentRepository;
        this.accessGuard = accessGuard;
    }

    @Override
    public LabReportResponse upload(Long appointmentId, MultipartFile file, String remarks) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        try {
            Files.createDirectories(uploadRoot);
            // The uploaded file name is never used as a path as-is: keep only safe characters.
            String safeName = sanitize(file.getOriginalFilename());
            Path destination = uploadRoot.resolve(UUID.randomUUID() + "-" + safeName).normalize();
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            LabReport report = new LabReport();
            report.setAppointment(appointment);
            report.setReportType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            report.setUploadTime(LocalDateTime.now());
            report.setFilePath(destination.toString());
            report.setRemarks(remarks);
            return LabReportResponse.from(labReportRepository.save(report));
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to save the uploaded file", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getReportsForAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        accessGuard.requireAppointmentDocumentRead(appointment, true);
        return labReportRepository.findByAppointment_AppointmentId(appointmentId).stream()
            .map(LabReportResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getAllReports() {
        return labReportRepository.findAll().stream().map(LabReportResponse::from).toList();
    }

    private static String sanitize(String original) {
        String name = original == null ? "report" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[^A-Za-z0-9._-]", "_");
        if (name.isBlank() || name.chars().allMatch(c -> c == '.')) name = "report";
        return name.length() > 100 ? name.substring(name.length() - 100) : name;
    }
}
