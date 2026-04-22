package com.mediqueue.entity;

import com.mediqueue.entity.enums.ResolutionStatus;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @Column(name = "complaint_id", length = 50)
    private String complaintId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "issue_type", length = 100)
    private String issueType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_on")
    private LocalDate createdOn;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_status")
    private ResolutionStatus resolutionStatus = ResolutionStatus.OPEN;

    public Complaint() {}

    public Complaint(String complaintId, Patient patient, String issueType, String description, LocalDate createdOn, ResolutionStatus resolutionStatus) {
        this.complaintId = complaintId;
        this.patient = patient;
        this.issueType = issueType;
        this.description = description;
        this.createdOn = createdOn;
        this.resolutionStatus = resolutionStatus;
    }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getCreatedOn() { return createdOn; }
    public void setCreatedOn(LocalDate createdOn) { this.createdOn = createdOn; }

    public ResolutionStatus getResolutionStatus() { return resolutionStatus; }
    public void setResolutionStatus(ResolutionStatus resolutionStatus) { this.resolutionStatus = resolutionStatus; }

    @PrePersist
    public void prePersist() {
        if (createdOn == null) createdOn = LocalDate.now();
    }
}
