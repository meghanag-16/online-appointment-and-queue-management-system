package com.mediqueue.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/**
 * The bytes of an uploaded lab report, kept in their own table so that listing reports never loads
 * the files; they are read only when a report is downloaded.
 */
@Entity
@Table(name = "lab_report_files")
public class LabReportFile {

    @Id
    @Column(name = "report_id")
    private Long reportId;

    @Lob
    @Column(name = "data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;

    protected LabReportFile() {}

    public LabReportFile(Long reportId, byte[] data) {
        this.reportId = reportId;
        this.data = data;
    }

    public Long getReportId() {
        return reportId;
    }

    public byte[] getData() {
        return data;
    }
}
