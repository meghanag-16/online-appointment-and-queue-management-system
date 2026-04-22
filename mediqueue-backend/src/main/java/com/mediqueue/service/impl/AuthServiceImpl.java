package com.mediqueue.service.impl;

import com.mediqueue.dto.AuthResponse;
import com.mediqueue.dto.LoginRequest;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.entity.*;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.exception.UnauthorizedException;
import com.mediqueue.factory.UserFactory;
import com.mediqueue.repository.*;
import com.mediqueue.security.JwtUtil;
import com.mediqueue.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final UserFactory userFactory;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository, DoctorRepository doctorRepository,
                         DepartmentRepository departmentRepository, UserFactory userFactory,
                         PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.userFactory = userFactory;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse register(RegisterRequest req) {
        // ── uniqueness guards ────────────────────────────────────────────────
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new DuplicateResourceException("Username already taken: " + req.getUsername());
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + req.getEmail());
        }

        // ── delegate to factory (Creational pattern) ─────────────────────────
        String encoded = passwordEncoder.encode(req.getPassword());
        User user = userFactory.createUser(
            req.getRole(),
            req.getName(),
            req.getUsername(),
            req.getEmail(),
            encoded
        );

        // ── role-specific supplementary fields ──────────────────────────────
        if (user instanceof Patient patient) {
            patient.setBloodGroup(req.getBloodGroup());
            patient.setEmergencyContact(req.getEmergencyContact());
        }

        if (user instanceof Doctor doctor) {
            doctor.setSpecialization(req.getSpecialization());
            doctor.setQualification(req.getQualification());
            doctor.setConsultationFee(BigDecimal.valueOf(500));
            if (req.getDepartmentId() != null) {
                Department dept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + req.getDepartmentId()));
                doctor.setDepartment(dept);
            }
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUserId(), user.getUsername(), user.getRole());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUserId(), user.getUsername(), user.getRole());
    }
}
