package com.mediqueue.dto;

public class DoctorDTO {
    private String userId;
    private String name;
    private String email;
    private String role;
    private String specialization;

    public DoctorDTO(String userId, String name, String email, String role, String specialization) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.specialization = specialization;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
}
