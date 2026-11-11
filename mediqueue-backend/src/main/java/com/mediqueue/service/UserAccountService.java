package com.mediqueue.service;

import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.dto.UserDTO;
import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.AccountStatus;

import java.util.List;

/**
 * Single path for creating user accounts. Public self-registration and administrator creation
 * both go through {@link #createUser}, using the same {@link RegisterRequest} fields and the same
 * per-role rules, so accounts created either way hold identical data.
 */
public interface UserAccountService {

    /**
     * Public sign-up. Patients are ACTIVE immediately. Staff roles (doctor, lab technician,
     * receptionist, administrator) are created PENDING_APPROVAL and cannot log in until an
     * administrator activates them.
     */
    User selfRegister(RegisterRequest request);

    /** Administrator creates an account for any role; it is ACTIVE immediately. */
    User createByAdmin(RegisterRequest request);

    /** Shared creation logic: validation, uniqueness, UserFactory, role-specific fields. */
    User createUser(RegisterRequest request, AccountStatus initialStatus);

    List<UserDTO> listUsers();

    /** Role-aware profile DTO (doctor / patient / basic). */
    Object getProfile(String userId);

    /** Administrator activates, suspends, deactivates or approves an account. */
    UserDTO updateStatus(String userId, String status);
}
