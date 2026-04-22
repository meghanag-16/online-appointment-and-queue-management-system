package com.mediqueue.dto;

import com.mediqueue.entity.enums.UserRole;

public class AuthResponse {
    private String token;
    private String userId;
    private String username;
    private UserRole role;

    public AuthResponse() {}

    public AuthResponse(String token, String userId, String username, UserRole role) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
}
