package com.mediqueue.dto;

import com.mediqueue.entity.Doctor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Safe view of a doctor (no password hash, no lazy entity graph) used by every doctor endpoint. */
public class DoctorDTO {
    private String userId;
    private String name;
    private String username;
    private String email;
    private String role;
    private String gender;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String specialization;
    private String qualification;
    private BigDecimal consultationFee;
    private String departmentId;
    private String departmentName;
    private String accountStatus;
    /** Earliest open slot (on the searched day, if a date was given); null = none. Set by doctor search. */
    private LocalDateTime nextAvailableSlot;

    public DoctorDTO() {}

    public DoctorDTO(String userId, String name, String email, String role, String specialization) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.specialization = specialization;
    }

    public static DoctorDTO from(Doctor d) {
        DoctorDTO dto = new DoctorDTO(d.getUserId(), d.getName(), d.getEmail(), "DOCTOR", d.getSpecialization());
        dto.username = d.getUsername();
        dto.gender = d.getGender();
        dto.phoneNumber = d.getPhoneNumber();
        dto.dateOfBirth = d.getDateOfBirth();
        dto.qualification = d.getQualification();
        dto.consultationFee = d.getConsultationFee();
        if (d.getDepartment() != null) {
            dto.departmentId = d.getDepartment().getDepartmentId();
            dto.departmentName = d.getDepartment().getDepartmentName();
        }
        dto.accountStatus = d.getAccountStatus() != null ? d.getAccountStatus().name() : null;
        return dto;
    }

    /** Kept for older UI code that reads {@code id}. */
    public String getId() { return userId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public LocalDateTime getNextAvailableSlot() { return nextAvailableSlot; }
    public void setNextAvailableSlot(LocalDateTime nextAvailableSlot) { this.nextAvailableSlot = nextAvailableSlot; }
}
