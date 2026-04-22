package com.mediqueue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medical_records")
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Long recordId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private Patient patient;

    @Column(name = "diagnoses", columnDefinition = "TEXT")
    private String diagnoses;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    public MedicalRecord() {}

    public MedicalRecord(Long recordId, Patient patient, String diagnoses, String observations) {
        this.recordId = recordId;
        this.patient = patient;
        this.diagnoses = diagnoses;
        this.observations = observations;
    }

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getDiagnoses() { return diagnoses; }
    public void setDiagnoses(String diagnoses) { this.diagnoses = diagnoses; }

    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
}
