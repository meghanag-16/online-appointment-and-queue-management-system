package com.mediqueue.controller;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.LabReport;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.LabReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/lab")
public class LabController {

    private final LabReportRepository labReportRepository;
    private final AppointmentRepository appointmentRepository;
    private final Path uploadRoot = Path.of("uploads", "lab");

    public LabController(LabReportRepository labReportRepository,
                         AppointmentRepository appointmentRepository) {
        this.labReportRepository = labReportRepository;
        this.appointmentRepository = appointmentRepository;
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException ignored) {
        }
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<Map<String, Object>> uploadReport(@RequestParam Long appointmentId,
                                                            @RequestParam MultipartFile file,
                                                            @RequestParam(required = false) String remarks) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Appointment not found"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "File is required"));
        }
        try {
            String filename = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();
            Path destination = uploadRoot.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            LabReport report = new LabReport();
            report.setAppointment(appointment);
            report.setReportType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            report.setUploadTime(LocalDateTime.now());
            report.setFilePath(destination.toString());
            report.setRemarks(remarks);
            labReportRepository.save(report);

            Map<String, Object> response = new HashMap<>();
            response.put("reportId", report.getReportId());
            response.put("appointmentId", appointmentId);
            response.put("filePath", report.getFilePath());
            response.put("remarks", report.getRemarks());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Unable to save file"));
        }
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT','LAB_TECHNICIAN','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getReportsByAppointment(@PathVariable Long appointmentId) {
        List<Map<String, Object>> response = labReportRepository.findByAppointment_AppointmentId(appointmentId).stream().map(report -> {
            Map<String, Object> item = new HashMap<>();
            item.put("reportId", report.getReportId());
            item.put("appointmentId", report.getAppointment().getAppointmentId());
            item.put("reportType", report.getReportType());
            item.put("uploadTime", report.getUploadTime());
            item.put("filePath", report.getFilePath());
            item.put("remarks", report.getRemarks());
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN','ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getAllReports() {
        List<Map<String, Object>> response = labReportRepository.findAll().stream().map(report -> {
            Map<String, Object> item = new HashMap<>();
            item.put("reportId", report.getReportId());
            item.put("appointmentId", report.getAppointment().getAppointmentId());
            item.put("reportType", report.getReportType());
            item.put("uploadTime", report.getUploadTime());
            item.put("filePath", report.getFilePath());
            item.put("remarks", report.getRemarks());
            item.put("patientId", report.getAppointment().getPatient().getUserId());
            item.put("doctorId", report.getAppointment().getDoctor().getUserId());
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
