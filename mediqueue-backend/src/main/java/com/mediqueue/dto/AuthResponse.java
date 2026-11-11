package com.mediqueue.dto;

import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.UserRole;

/** Login/registration result: the JWT plus who the user is. */
public class AuthResponse {
    private String token;
    private String userId;
    private String username;
    private String name;
    private UserRole role;
    private AccountStatus accountStatus;
    private String message;
    /** True when the password was set by the administrator: the user must choose a new one first. */
    private boolean mustChangePassword;

    public AuthResponse() {}

    public AuthResponse(String token, String userId, String username, UserRole role) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.accountStatus = AccountStatus.ACTIVE;
    }

    public AuthResponse(String token, String userId, String username, String name, UserRole role,
                        AccountStatus accountStatus, String message) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.name = name;
        this.role = role;
        this.accountStatus = accountStatus;
        this.message = message;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }
}
