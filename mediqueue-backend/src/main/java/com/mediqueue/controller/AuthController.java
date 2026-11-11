package com.mediqueue.controller;

import com.mediqueue.dto.AuthResponse;
import com.mediqueue.dto.LoginRequest;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.AuthService;
import com.mediqueue.service.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserAccountService userAccountService;
    private final CurrentUserService currentUser;

    public AuthController(AuthService authService,
                          UserAccountService userAccountService,
                          CurrentUserService currentUser) {
        this.authService = authService;
        this.userAccountService = userAccountService;
        this.currentUser = currentUser;
    }

    /**
     * Public sign-up. Patients get a token straight away; staff roles are created
     * PENDING_APPROVAL and get no token until an administrator activates them.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** The logged-in user's own profile (401 if the token is missing or expired). */
    @GetMapping("/me")
    public ResponseEntity<Object> me() {
        return ResponseEntity.ok(userAccountService.getProfile(currentUser.userId()));
    }
}
