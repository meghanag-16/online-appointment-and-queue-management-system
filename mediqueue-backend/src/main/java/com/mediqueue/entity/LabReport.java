package com.mediqueue.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_reports")
public class LabReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Column(name = "report_type", length = 100)
    private String reportType;

    @Column(name = "upload_time")
    private LocalDateTime uploadTime;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    public LabReport() {}

    public LabReport(Long reportId, Appointment appointment, String reportType, LocalDateTime uploadTime, String filePath, String remarks) {
        this.reportId = reportId;
        this.appointment = appointment;
        this.reportType = reportType;
        this.uploadTime = uploadTime;
        this.filePath = filePath;
        this.remarks = remarks;
    }

    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public LocalDateTime getUploadTime() { return uploadTime; }
    public void setUploadTime(LocalDateTime uploadTime) { this.uploadTime = uploadTime; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    @PrePersist
    public void prePersist() {
        if (uploadTime == null) uploadTime = LocalDateTime.now();
    }
}
