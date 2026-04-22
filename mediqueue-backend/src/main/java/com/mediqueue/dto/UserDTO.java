package com.mediqueue.dto;

public class UserDTO {
    private String userId;
    private String name;
    private String username;
    private String email;
    private String role;
    private String accountStatus;

    public UserDTO(String userId, String name, String username, String email, String role, String accountStatus) {
        this.userId = userId;
        this.name = name;
        this.username = username;
        this.email = email;
        this.role = role;
        this.accountStatus = accountStatus;
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
}
