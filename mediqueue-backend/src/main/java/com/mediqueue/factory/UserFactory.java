package com.mediqueue.factory;

import com.mediqueue.entity.*;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.UserRole;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * UserFactory — Creational (Factory) pattern.
 * Centralises role-based object instantiation at registration time.
 * Callers provide a RegisterRequest; the factory decides which concrete
 * User subclass to build, assigns a UUID, and sets the role field.
 */
@Component
public class UserFactory {

    /**
     * Creates and returns the correct User subclass based on the requested role.
     *
     * @param role     the role enum value
     * @param name     full name
     * @param username unique username
     * @param email    unique email
     * @param encodedPassword BCrypt-encoded password (caller must encode before passing in)
     * @return a new, unsaved User subclass instance
     */
    public User createUser(UserRole role,
                           String name,
                           String username,
                           String email,
                           String encodedPassword) {

        String userId = "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        return switch (role) {
            case PATIENT -> buildPatient(userId, name, username, email, encodedPassword);
            case DOCTOR -> buildDoctor(userId, name, username, email, encodedPassword);
            case LAB_TECHNICIAN -> buildLabTechnician(userId, name, username, email, encodedPassword);
            case RECEPTIONIST -> buildReceptionist(userId, name, username, email, encodedPassword);
            case ADMINISTRATOR -> buildAdministrator(userId, name, username, email, encodedPassword);
        };
    }

    // ── private builders ────────────────────────────────────────────────────

    private Patient buildPatient(String id, String name, String username,
                                 String email, String password) {
        Patient p = new Patient();
        populate(p, id, name, username, email, password, UserRole.PATIENT);
        return p;
    }

    private Doctor buildDoctor(String id, String name, String username,
                               String email, String password) {
        Doctor d = new Doctor();
        populate(d, id, name, username, email, password, UserRole.DOCTOR);
        return d;
    }

    private LabTechnician buildLabTechnician(String id, String name, String username,
                                             String email, String password) {
        LabTechnician lt = new LabTechnician();
        populate(lt, id, name, username, email, password, UserRole.LAB_TECHNICIAN);
        return lt;
    }

    private Receptionist buildReceptionist(String id, String name, String username,
                                           String email, String password) {
        Receptionist r = new Receptionist();
        populate(r, id, name, username, email, password, UserRole.RECEPTIONIST);
        return r;
    }

    private Administrator buildAdministrator(String id, String name, String username,
                                             String email, String password) {
        Administrator a = new Administrator();
        populate(a, id, name, username, email, password, UserRole.ADMINISTRATOR);
        return a;
    }

    private void populate(User user, String id, String name, String username,
                          String email, String password, UserRole role) {
        user.setUserId(id);
        user.setName(name);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(password);
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
    }
}
