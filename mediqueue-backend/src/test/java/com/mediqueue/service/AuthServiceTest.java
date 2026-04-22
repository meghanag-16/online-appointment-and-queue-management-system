package com.mediqueue.service;

import com.mediqueue.dto.AuthResponse;
import com.mediqueue.dto.LoginRequest;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.UnauthorizedException;
import com.mediqueue.factory.UserFactory;
import com.mediqueue.repository.DepartmentRepository;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.security.JwtUtil;
import com.mediqueue.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock DepartmentRepository departmentRepository;
    @Mock UserFactory userFactory;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;

    @InjectMocks AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private Patient patientUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setName("Anika Sharma");
        registerRequest.setUsername("anika");
        registerRequest.setEmail("anika@test.com");
        registerRequest.setPassword("secret123");
        registerRequest.setRole(UserRole.PATIENT);

        patientUser = new Patient();
        patientUser.setUserId("USR-ABCD1234");
        patientUser.setUsername("anika");
        patientUser.setEmail("anika@test.com");
        patientUser.setRole(UserRole.PATIENT);
        patientUser.setPassword("$2a$encoded");
    }

    // ── Registration tests ────────────────────────────────────────────────────

    @Test
    @DisplayName("register: success — returns JWT token and correct role")
    void register_success() {
        when(userRepository.existsByUsername("anika")).thenReturn(false);
        when(userRepository.existsByEmail("anika@test.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("$2a$encoded");
        when(userFactory.createUser(eq(UserRole.PATIENT), any(), any(), any(), any()))
            .thenReturn(patientUser);
        when(userRepository.save(any())).thenReturn(patientUser);
        when(jwtUtil.generateToken("anika", "PATIENT")).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getRole()).isEqualTo(UserRole.PATIENT);
        assertThat(response.getUsername()).isEqualTo("anika");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register: duplicate username throws DuplicateResourceException")
    void register_duplicateUsername_throws() {
        when(userRepository.existsByUsername("anika")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("Username already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register: duplicate email throws DuplicateResourceException")
    void register_duplicateEmail_throws() {
        when(userRepository.existsByUsername("anika")).thenReturn(false);
        when(userRepository.existsByEmail("anika@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("Email already registered");
    }

    @Test
    @DisplayName("register: UserFactory is called with correct role")
    void register_callsFactory_withCorrectRole() {
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userFactory.createUser(any(), any(), any(), any(), any())).thenReturn(patientUser);
        when(jwtUtil.generateToken(any(), any())).thenReturn("tok");

        authService.register(registerRequest);

        verify(userFactory).createUser(eq(UserRole.PATIENT), eq("Anika Sharma"),
            eq("anika"), eq("anika@test.com"), eq("encoded"));
    }

    // ── Login tests ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: success — valid credentials return token")
    void login_success() {
        LoginRequest req = new LoginRequest();
        req.setUsername("anika");
        req.setPassword("secret123");

        when(userRepository.findByUsername("anika")).thenReturn(Optional.of(patientUser));
        when(passwordEncoder.matches("secret123", "$2a$encoded")).thenReturn(true);
        when(jwtUtil.generateToken("anika", "PATIENT")).thenReturn("valid.token");

        AuthResponse response = authService.login(req);

        assertThat(response.getToken()).isEqualTo("valid.token");
        assertThat(response.getRole()).isEqualTo(UserRole.PATIENT);
    }

    @Test
    @DisplayName("login: unknown username throws UnauthorizedException")
    void login_unknownUser_throws() {
        LoginRequest req = new LoginRequest();
        req.setUsername("ghost");
        req.setPassword("pass");

        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("login: wrong password throws UnauthorizedException")
    void login_wrongPassword_throws() {
        LoginRequest req = new LoginRequest();
        req.setUsername("anika");
        req.setPassword("wrongpass");

        when(userRepository.findByUsername("anika")).thenReturn(Optional.of(patientUser));
        when(passwordEncoder.matches("wrongpass", "$2a$encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(UnauthorizedException.class);
    }
}
