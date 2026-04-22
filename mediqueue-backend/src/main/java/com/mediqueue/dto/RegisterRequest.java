package com.mediqueue.dto;

import com.mediqueue.entity.enums.UserRole;

public class RegisterRequest {
    private String name;
    private String username;
    private String email;
    private String password;
    private UserRole role;
    private String bloodGroup;
    private String emergencyContact;
    private String specialization;
    private String qualification;
    private String departmentId;

    public RegisterRequest() {}

    public RegisterRequest(String name, String username, String email, String password, UserRole role, String bloodGroup, String emergencyContact, String specialization, String qualification, String departmentId) {
        this.name = name;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.bloodGroup = bloodGroup;
        this.emergencyContact = emergencyContact;
        this.specialization = specialization;
        this.qualification = qualification;
        this.departmentId = departmentId;
    }

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

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
}
