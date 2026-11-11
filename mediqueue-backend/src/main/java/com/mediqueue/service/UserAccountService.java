package com.mediqueue.service;

import com.mediqueue.dto.ChangePasswordRequest;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.dto.UpdateProfileRequest;
import com.mediqueue.dto.UserDTO;
import com.mediqueue.entity.User;

import java.util.List;

/**
 * Single path for creating user accounts. Public patient sign-up and administrator creation
 * both go through the same validation, uniqueness checks, UserFactory and per-role fields.
 *
 * Only patients can sign up publicly. Doctors, lab technicians, receptionists and administrators
 * are created by an administrator, log in with the credentials they were given, and can then
 * change their own details and password from their portal.
 */
public interface UserAccountService {

    /** Public sign-up: creates an ACTIVE patient. Any other requested role is rejected (403). */
    User registerPatient(RegisterRequest request);

    /** Administrator creates an account for any role; it is ACTIVE immediately. */
    User createByAdmin(RegisterRequest request);

    List<UserDTO> listUsers();

    /** Role-aware profile DTO (doctor / patient / basic). */
    Object getProfile(String userId);

    /** The logged-in user updates their own contact (and role-appropriate) details. */
    Object updateOwnProfile(UpdateProfileRequest request);

    /** The logged-in user changes their own password; the current password must match. */
    void changeOwnPassword(ChangePasswordRequest request);

    /** Administrator activates, suspends or deactivates an account. */
    UserDTO updateStatus(String userId, String status);
}
