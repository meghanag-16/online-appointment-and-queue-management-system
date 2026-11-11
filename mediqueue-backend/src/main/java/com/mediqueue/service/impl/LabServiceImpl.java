package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.LabAppointmentResponse;
import com.mediqueue.dto.LabReportResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.LabReport;
import com.mediqueue.entity.LabReportFile;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.lab.LabFileValidator;
import com.mediqueue.lab.LabFileValidator.AcceptedFile;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.LabReportFileRepository;
import com.mediqueue.repository.LabReportRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.LabService;
import com.mediqueue.service.facade.NotificationFacade;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class LabServiceImpl implements LabService {

    /** Reports can't be attached to visits that never happened. */
    private static final Set<AppointmentStatus> NO_UPLOAD =
            EnumSet.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW);

    private final LabReportRepository labReportRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccessGuard accessGuard;
    private final CurrentUserService currentUser;
    private final NotificationFacade notificationFacade;
    private final AuditService auditService;
    private final LabReportFileRepository labReportFileRepository;
    private final Path uploadRoot;

    public LabServiceImpl(
            LabReportRepository labReportRepository,
            AppointmentRepository appointmentRepository,
            AccessGuard accessGuard,
            CurrentUserService currentUser,
            NotificationFacade notificationFacade,
            AuditService auditService,
            LabReportFileRepository labReportFileRepository,
            @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.labReportRepository = labReportRepository;
        this.appointmentRepository = appointmentRepository;
        this.accessGuard = accessGuard;
        this.currentUser = currentUser;
        this.notificationFacade = notificationFacade;
        this.auditService = auditService;
        this.labReportFileRepository = labReportFileRepository;
        this.uploadRoot = Path.of(uploadDir, "lab").toAbsolutePath().normalize();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabAppointmentResponse> searchAppointments(String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty())
            throw new BadRequestException(
                    "Enter an appointment ID, a patient ID or a patient name");
        Long id = null;
        String digits = q.startsWith("#") ? q.substring(1) : q;
        if (digits.matches("\\d{1,18}")) id = Long.valueOf(digits);
        return appointmentRepository
                .searchForLab(id != null ? id : -1L, q, PageRequest.of(0, 50))
                .stream()
                .map(
                        a ->
                                new LabAppointmentResponse(
                                        a.getAppointmentId(),
                                        a.getPatient().getUserId(),
                                        a.getPatient().getName(),
                                        a.getDoctor().getName(),
                                        a.getDoctor().getDepartment() != null
                                                ? a.getDoctor().getDepartment().getDepartmentName()
                                                : null,
                                        a.getAppointmentDate(),
                                        a.getSlot() != null ? a.getSlot().getStartTime() : null,
                                        a.getAppointmentStatus().name(),
                                        labReportRepository.countByAppointment_AppointmentId(
                                                a.getAppointmentId()),
                                        !NO_UPLOAD.contains(a.getAppointmentStatus())))
                .toList();
    }

    @Override
    public LabReportResponse upload(
            Long appointmentId, String reportType, String remarks, MultipartFile file) {
        Appointment appointment = findAppointment(appointmentId);
        if (NO_UPLOAD.contains(appointment.getAppointmentStatus())) {
            throw new BadRequestException(
                    "Appointment #"
                            + appointmentId
                            + " was "
                            + appointment
                                    .getAppointmentStatus()
                                    .name()
                                    .replace('_', ' ')
                                    .toLowerCase()
                            + "; reports can't be attached to it");
        }
        String testName = reportType == null ? "" : reportType.trim();
        if (testName.isEmpty())
            throw new BadRequestException("Enter the test name, e.g. Blood test");
        if (testName.length() > 100)
            throw new BadRequestException("The test name must be at most 100 characters");
        if (remarks != null && remarks.length() > 2000)
            throw new BadRequestException("Remarks must be at most 2000 characters");
        if (file == null || file.isEmpty())
            throw new BadRequestException("Choose a file to upload");

        byte[] bytes = readAll(file);
        AcceptedFile accepted =
                LabFileValidator.validate(
                        file.getOriginalFilename(),
                        bytes.length,
                        Arrays.copyOf(bytes, Math.min(bytes.length, 16)));

        LabReport report = new LabReport();
        report.setAppointment(appointment);
        report.setReportType(testName);
        report.setRemarks(remarks == null || remarks.isBlank() ? null : remarks.trim());
        report.setOriginalFileName(LabFileValidator.cleanFileName(file.getOriginalFilename()));
        report.setContentType(accepted.contentType());
        report.setFileSize((long) bytes.length);
        report.setUploadedBy(currentUser.userId());
        LabReport saved = labReportRepository.saveAndFlush(report);
        // The file is stored in the database, so it survives restarts on hosts without a disk.
        labReportFileRepository.save(new LabReportFile(saved.getReportId(), bytes));

        notificationFacade.reportReady(saved); // REPORT_READY to the patient
        auditService.record(
                AuditAction.LAB_REPORT_UPLOADED,
                "LAB_REPORT",
                saved.getReportId(),
                testName
                        + " for "
                        + appointment.getPatient().getName()
                        + ", appointment #"
                        + appointmentId);
        return LabReportResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getReportsForAppointment(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        accessGuard.requireAppointmentDocumentRead(appointment, true);
        return labReportRepository
                .findByAppointment_AppointmentIdOrderByUploadTimeDesc(appointmentId)
                .stream()
                .map(LabReportResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getReportsForPatient(String patientId) {
        accessGuard.requirePatientAccess(patientId);
        return labReportRepository
                .findByAppointment_Patient_UserIdOrderByUploadTimeDesc(patientId)
                .stream()
                .map(LabReportResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getAllReports() {
        return labReportRepository.findAllByOrderByUploadTimeDesc().stream()
                .map(LabReportResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Download download(Long reportId) {
        LabReport report =
                labReportRepository
                        .findById(reportId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Lab report not found: " + reportId));
        accessGuard.requireAppointmentDocumentRead(report.getAppointment(), true);

        String name =
                report.getOriginalFileName() != null
                        ? report.getOriginalFileName()
                        : "report-" + reportId;
        String type =
                report.getContentType() != null
                        ? report.getContentType()
                        : "application/octet-stream";
        var stored = labReportFileRepository.findById(reportId);
        if (stored.isPresent()) {
            byte[] data = stored.get().getData();
            return new Download(new ByteArrayResource(data), name, type, data.length);
        }
        return legacyFileOnDisk(report, name, type);
    }

    /** Reports uploaded by older versions were written to disk under app.upload.dir. */
    private Download legacyFileOnDisk(LabReport report, String name, String type) {
        Path path =
                report.getFilePath() == null
                        ? null
                        : Path.of(report.getFilePath()).toAbsolutePath().normalize();
        if (path == null || !path.startsWith(uploadRoot) || !Files.isRegularFile(path)) {
            throw new ResourceNotFoundException(
                    "The file for report #" + report.getReportId() + " is missing on the server");
        }
        try {
            return new Download(new FileSystemResource(path), name, type, Files.size(path));
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read the report file", e);
        }
    }

    private Appointment findAppointment(Long id) {
        return appointmentRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
    }

    private static byte[] readAll(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read the uploaded file", e);
        }
    }
}
