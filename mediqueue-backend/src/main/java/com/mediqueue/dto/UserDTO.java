package com.mediqueue.dto;

import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.User;

import java.time.LocalDate;

/** Safe view of any user account (never contains the password hash). */
public class UserDTO {
    private String userId;
    private String name;
    private String username;
    private String email;
    private String role;
    private String accountStatus;
    private String gender;
    private String phoneNumber;
    private LocalDate dateOfBirth;

    public UserDTO(String userId, String name, String username, String email, String role, String accountStatus) {
        this.userId = userId;
        this.name = name;
        this.username = username;
        this.email = email;
        this.role = role;
        this.accountStatus = accountStatus;
    }

    public static UserDTO from(User u) {
        UserDTO dto = new UserDTO(u.getUserId(), u.getName(), u.getUsername(), u.getEmail(),
            u.getRole() != null ? u.getRole().name() : null,
            u.getAccountStatus() != null ? u.getAccountStatus().name() : null);
        dto.gender = u.getGender();
        dto.phoneNumber = u.getPhoneNumber();
        dto.dateOfBirth = u.getDateOfBirth();
        return dto;
    }

    /** Role-aware mapping: doctors get the full {@link DoctorDTO}, patients their profile fields. */
    public static Object profileOf(User u) {
        if (u instanceof Doctor d) return DoctorDTO.from(d);
        if (u instanceof Patient p) return PatientProfileDTO.from(p);
        return from(u);
    }

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

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
}
