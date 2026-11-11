package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.LabAppointmentResponse;
import com.mediqueue.dto.LabReportResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.LabReport;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.lab.LabFileValidator;
import com.mediqueue.lab.LabFileValidator.AcceptedFile;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.LabReportRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.LabService;
import com.mediqueue.service.facade.NotificationFacade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class LabServiceImpl implements LabService {

    private static final Logger log = LoggerFactory.getLogger(LabServiceImpl.class);

    /** Reports can't be attached to visits that never happened. */
    private static final Set<AppointmentStatus> NO_UPLOAD = EnumSet.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW);

    private final LabReportRepository labReportRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccessGuard accessGuard;
    private final CurrentUserService currentUser;
    private final NotificationFacade notificationFacade;
    private final AuditService auditService;
    private final Path uploadRoot;

    public LabServiceImpl(LabReportRepository labReportRepository,
                          AppointmentRepository appointmentRepository,
                          AccessGuard accessGuard,
                          CurrentUserService currentUser,
                          NotificationFacade notificationFacade,
                          AuditService auditService,
                          @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.labReportRepository = labReportRepository;
        this.appointmentRepository = appointmentRepository;
        this.accessGuard = accessGuard;
        this.currentUser = currentUser;
        this.notificationFacade = notificationFacade;
        this.auditService = auditService;
        this.uploadRoot = Path.of(uploadDir, "lab").toAbsolutePath().normalize();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabAppointmentResponse> searchAppointments(String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) throw new BadRequestException("Enter an appointment ID, a patient ID or a patient name");
        Long id = null;
        String digits = q.startsWith("#") ? q.substring(1) : q;
        if (digits.matches("\\d{1,18}")) id = Long.valueOf(digits);
        return appointmentRepository.searchForLab(id != null ? id : -1L, q, PageRequest.of(0, 50)).stream()
            .map(a -> new LabAppointmentResponse(a.getAppointmentId(), a.getPatient().getUserId(), a.getPatient().getName(),
                a.getDoctor().getName(),
                a.getDoctor().getDepartment() != null ? a.getDoctor().getDepartment().getDepartmentName() : null,
                a.getAppointmentDate(), a.getSlot() != null ? a.getSlot().getStartTime() : null,
                a.getAppointmentStatus().name(),
                labReportRepository.countByAppointment_AppointmentId(a.getAppointmentId()),
                !NO_UPLOAD.contains(a.getAppointmentStatus())))
            .toList();
    }

    @Override
    public LabReportResponse upload(Long appointmentId, String reportType, String remarks, MultipartFile file) {
        Appointment appointment = findAppointment(appointmentId);
        if (NO_UPLOAD.contains(appointment.getAppointmentStatus())) {
            throw new BadRequestException("Appointment #" + appointmentId + " was "
                + appointment.getAppointmentStatus().name().replace('_', ' ').toLowerCase()
                + "; reports can't be attached to it");
        }
        String testName = reportType == null ? "" : reportType.trim();
        if (testName.isEmpty()) throw new BadRequestException("Enter the test name, e.g. Blood test");
        if (testName.length() > 100) throw new BadRequestException("The test name must be at most 100 characters");
        if (remarks != null && remarks.length() > 2000) throw new BadRequestException("Remarks must be at most 2000 characters");
        if (file == null || file.isEmpty()) throw new BadRequestException("Choose a file to upload");

        AcceptedFile accepted = LabFileValidator.validate(file.getOriginalFilename(), file.getSize(), head(file));
        // Stored under a generated name: the uploaded name never becomes part of a path on disk.
        Path destination = uploadRoot.resolve(UUID.randomUUID() + "." + accepted.extension()).normalize();
        if (!destination.startsWith(uploadRoot)) throw new BadRequestException("Invalid file name");
        try {
            Files.createDirectories(uploadRoot);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to save the uploaded file", e);
        }
        deleteFileIfRolledBack(destination);

        LabReport report = new LabReport();
        report.setAppointment(appointment);
        report.setReportType(testName);
        report.setRemarks(remarks == null || remarks.isBlank() ? null : remarks.trim());
        report.setFilePath(destination.toString());
        report.setOriginalFileName(LabFileValidator.cleanFileName(file.getOriginalFilename()));
        report.setContentType(accepted.contentType());
        report.setFileSize(file.getSize());
        report.setUploadedBy(currentUser.userId());
        LabReport saved = labReportRepository.save(report);

        notificationFacade.reportReady(saved);   // REPORT_READY to the patient
        auditService.record(AuditAction.LAB_REPORT_UPLOADED, "LAB_REPORT", saved.getReportId(),
            testName + " for " + appointment.getPatient().getName() + ", appointment #" + appointmentId);
        return LabReportResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getReportsForAppointment(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        accessGuard.requireAppointmentDocumentRead(appointment, true);
        return labReportRepository.findByAppointment_AppointmentIdOrderByUploadTimeDesc(appointmentId).stream()
            .map(LabReportResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getReportsForPatient(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        return labReportRepository.findByAppointment_Patient_UserIdOrderByUploadTimeDesc(patientId).stream()
            .map(LabReportResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getAllReports() {
        return labReportRepository.findAllByOrderByUploadTimeDesc().stream().map(LabReportResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Download download(Long reportId) {
        LabReport report = labReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Lab report not found: " + reportId));
        accessGuard.requireAppointmentDocumentRead(report.getAppointment(), true);

        Path path = Path.of(report.getFilePath()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            throw new ResourceNotFoundException("The file for report #" + reportId + " is missing on the server");
        }
        String name = report.getOriginalFileName() != null ? report.getOriginalFileName() : "report-" + reportId;
        String type = report.getContentType() != null ? report.getContentType() : "application/octet-stream";
        try {
            return new Download(new FileSystemResource(path), name, type, Files.size(path));
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read the report file", e);
        }
    }

    private Appointment findAppointment(Long id) {
        return appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
    }

    private static byte[] head(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(16);
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read the uploaded file", e);
        }
    }

    /** If saving the database row fails, don't leave an orphan file behind. */
    private static void deleteFileIfRolledBack(Path file) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException e) {
                        log.warn("Could not delete orphan upload {}", file, e);
                    }
                }
            }
        });
    }
}
