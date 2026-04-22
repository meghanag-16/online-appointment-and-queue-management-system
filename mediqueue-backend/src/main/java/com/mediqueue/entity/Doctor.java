package com.mediqueue.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "doctors")
@PrimaryKeyJoinColumn(name = "user_id")
public class Doctor extends User {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "qualification", length = 200)
    private String qualification;

    @Column(name = "specialization", length = 100)
    private String specialization;

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee = BigDecimal.ZERO;

    public Doctor() {}

    public Doctor(Department department, String qualification, String specialization, BigDecimal consultationFee) {
        this.department = department;
        this.qualification = qualification;
        this.specialization = specialization;
        this.consultationFee = consultationFee;
    }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }
}
