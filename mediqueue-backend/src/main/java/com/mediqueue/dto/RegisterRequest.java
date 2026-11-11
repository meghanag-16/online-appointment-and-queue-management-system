package com.mediqueue.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.mediqueue.entity.enums.UserRole;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * The ONE user-profile definition, shared by public self-registration and by administrator
 * user creation, so both paths collect and store exactly the same fields for every role.
 *
 * Common fields apply to all roles. Patient fields are stored only for PATIENT, doctor fields
 * only for DOCTOR; role-specific "required" rules are enforced in UserAccountService.
 */
public class RegisterRequest {

    // ── common (all roles) ──────────────────────────────────────────────────
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be 3 to 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "Username may contain only letters, digits, '.', '_' and '-'")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email address is not valid")
    @Size(max = 100, message = "Email must be at most 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Gender must be MALE, FEMALE or OTHER")
    private String gender;

    @JsonAlias("phone")
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9][0-9 -]{6,13}$", message = "Phone number must be 7 to 15 digits")
    private String phoneNumber;

    @JsonAlias("dob")
    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    // ── PATIENT ─────────────────────────────────────────────────────────────
    @Pattern(regexp = "^$|^(A|B|AB|O)[+-]$", message = "Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-")
    private String bloodGroup;

    @Size(max = 2000, message = "Allergies must be at most 2000 characters")
    private String allergies;

    @Size(max = 2000, message = "Chronic conditions must be at most 2000 characters")
    private String chronicConditions;

    @Size(max = 150, message = "Emergency contact must be at most 150 characters")
    private String emergencyContact;

    // ── DOCTOR ──────────────────────────────────────────────────────────────
    private String departmentId;

    @Size(max = 100, message = "Specialization must be at most 100 characters")
    private String specialization;

    @Size(max = 200, message = "Qualification must be at most 200 characters")
    private String qualification;

    @DecimalMin(value = "0.0", message = "Consultation fee cannot be negative")
    @DecimalMax(value = "99999999.99", message = "Consultation fee is too large")
    private BigDecimal consultationFee;

    public RegisterRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(String chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }
}
