package com.mediqueue.service;

import com.mediqueue.dto.AuthResponse;
import com.mediqueue.dto.LoginRequest;
import com.mediqueue.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
