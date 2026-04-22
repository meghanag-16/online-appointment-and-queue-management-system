package com.mediqueue.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_id")
    private Long prescriptionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "diagnosis_notes", columnDefinition = "TEXT")
    private String diagnosisNotes;

    @Column(name = "medication_list", columnDefinition = "TEXT")
    private String medicationList;

    @Column(name = "advice", columnDefinition = "TEXT")
    private String advice;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    public Prescription() {}

    public Prescription(Long prescriptionId, Appointment appointment, String diagnosisNotes, String medicationList, String advice, LocalDate followUpDate, LocalDateTime issuedAt) {
        this.prescriptionId = prescriptionId;
        this.appointment = appointment;
        this.diagnosisNotes = diagnosisNotes;
        this.medicationList = medicationList;
        this.advice = advice;
        this.followUpDate = followUpDate;
        this.issuedAt = issuedAt;
    }

    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getDiagnosisNotes() { return diagnosisNotes; }
    public void setDiagnosisNotes(String diagnosisNotes) { this.diagnosisNotes = diagnosisNotes; }

    public String getMedicationList() { return medicationList; }
    public void setMedicationList(String medicationList) { this.medicationList = medicationList; }

    public String getAdvice() { return advice; }
    public void setAdvice(String advice) { this.advice = advice; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    @PrePersist
    public void prePersist() {
        if (issuedAt == null) issuedAt = LocalDateTime.now();
    }
}
