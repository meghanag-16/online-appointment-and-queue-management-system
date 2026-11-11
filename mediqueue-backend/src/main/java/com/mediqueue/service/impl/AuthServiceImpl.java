package com.mediqueue.service.impl;

import com.mediqueue.dto.AuthResponse;
import com.mediqueue.dto.LoginRequest;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.exception.AccountInactiveException;
import com.mediqueue.exception.UnauthorizedException;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.security.JwtUtil;
import com.mediqueue.service.AuthService;
import com.mediqueue.service.UserAccountService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserAccountService userAccountService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(
            UserRepository userRepository,
            UserAccountService userAccountService,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.userAccountService = userAccountService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /** Public sign-up is for patients only; they are logged in straight away. */
    @Override
    public AuthResponse register(RegisterRequest req) {
        return tokenFor(userAccountService.registerPatient(req));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user =
                userRepository
                        .findByUsername(req.getUsername().trim())
                        .orElseThrow(
                                () -> new UnauthorizedException("Invalid username or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username or password");
        }
        // Checked after the password so account state is not revealed to someone guessing.
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccountInactiveException(
                    "Your account is " + AccountStatus.describe(user.getAccountStatus()) + ".");
        }
        return tokenFor(user);
    }

    private AuthResponse tokenFor(User user) {
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        AuthResponse response =
                new AuthResponse(
                        token,
                        user.getUserId(),
                        user.getUsername(),
                        user.getName(),
                        user.getRole(),
                        user.getAccountStatus(),
                        null);
        response.setMustChangePassword(user.isMustChangePassword());
        return response;
    }
}
