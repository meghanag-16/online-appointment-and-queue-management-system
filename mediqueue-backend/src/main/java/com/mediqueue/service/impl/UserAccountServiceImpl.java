package com.mediqueue.service.impl;

import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.dto.UserDTO;
import com.mediqueue.entity.Department;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.factory.UserFactory;
import com.mediqueue.repository.DepartmentRepository;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.UserAccountService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class UserAccountServiceImpl implements UserAccountService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final UserFactory userFactory;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUser;

    public UserAccountServiceImpl(UserRepository userRepository,
                                  DepartmentRepository departmentRepository,
                                  UserFactory userFactory,
                                  PasswordEncoder passwordEncoder,
                                  CurrentUserService currentUser) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.userFactory = userFactory;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
    }

    @Override
    public User selfRegister(RegisterRequest request) {
        AccountStatus status = request.getRole() == UserRole.PATIENT
            ? AccountStatus.ACTIVE
            : AccountStatus.PENDING_APPROVAL;
        return createUser(request, status);
    }

    @Override
    public User createByAdmin(RegisterRequest request) {
        return createUser(request, AccountStatus.ACTIVE);
    }

    @Override
    public User createUser(RegisterRequest req, AccountStatus initialStatus) {
        String username = req.getUsername().trim();
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        // ── uniqueness guards (409 instead of a raw SQL error) ─────────────
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username already taken: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        // ── per-role required fields ───────────────────────────────────────
        Department department = null;
        if (req.getRole() == UserRole.DOCTOR) {
            if (isBlank(req.getSpecialization())) throw new BadRequestException("Specialization is required for doctors");
            if (isBlank(req.getDepartmentId())) throw new BadRequestException("Department is required for doctors");
            if (req.getConsultationFee() == null) throw new BadRequestException("Consultation fee is required for doctors");
            department = departmentRepository.findById(req.getDepartmentId())
                .orElseThrow(() -> new BadRequestException("Department not found: " + req.getDepartmentId()));
        }

        // ── Factory pattern: the right User subclass for the role ──────────
        User user = userFactory.createUser(
            req.getRole(), req.getName().trim(), username, email,
            passwordEncoder.encode(req.getPassword()));

        // ── common profile fields (all roles) ──────────────────────────────
        user.setGender(req.getGender());
        user.setPhoneNumber(req.getPhoneNumber().trim());
        user.setDateOfBirth(req.getDateOfBirth());
        user.setAccountStatus(initialStatus);

        // ── role-specific fields ───────────────────────────────────────────
        if (user instanceof Patient patient) {
            patient.setBloodGroup(blankToNull(req.getBloodGroup()));
            patient.setAllergies(blankToNull(req.getAllergies()));
            patient.setChronicConditions(blankToNull(req.getChronicConditions()));
            patient.setEmergencyContact(blankToNull(req.getEmergencyContact()));
        }
        if (user instanceof Doctor doctor) {
            doctor.setDepartment(department);
            doctor.setSpecialization(req.getSpecialization().trim());
            doctor.setQualification(blankToNull(req.getQualification()));
            doctor.setConsultationFee(req.getConsultationFee());
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> listUsers() {
        return userRepository.findAllUsersRaw().stream()
            .map(row -> new UserDTO((String) row[0], (String) row[1], (String) row[2],
                                    (String) row[3], (String) row[4], (String) row[5]))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Object getProfile(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return UserDTO.profileOf(user);
    }

    @Override
    public UserDTO updateStatus(String userId, String status) {
        AccountStatus newStatus;
        try {
            newStatus = AccountStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid account status: " + status
                + " (allowed: ACTIVE, SUSPENDED, DEACTIVATED, PENDING_APPROVAL)");
        }
        if (userId.equals(currentUser.userId()) && newStatus != AccountStatus.ACTIVE) {
            throw new BadRequestException("You cannot suspend or deactivate your own account");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setAccountStatus(newStatus);
        return UserDTO.from(userRepository.save(user));
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static String blankToNull(String s) { return isBlank(s) ? null : s.trim(); }
}
