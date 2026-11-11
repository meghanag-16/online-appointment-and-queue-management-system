package com.mediqueue.controller;

import com.mediqueue.dto.AccountCreatedResponse;
import com.mediqueue.dto.AdminAccountRequests;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.dto.StatusUpdateRequest;
import com.mediqueue.dto.UserDTO;
import com.mediqueue.service.UserAccountService;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Administrator user management: list, create (any role), view profile,
 * activate/suspend/deactivate.
 */
@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminUsersController {

    private final UserAccountService userAccountService;
    private final Validator validator;

    public AdminUsersController(UserAccountService userAccountService, Validator validator) {
        this.userAccountService = userAccountService;
        this.validator = validator;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userAccountService.listUsers());
    }

    /**
     * The only way to create doctor, lab technician, receptionist and administrator accounts. The
     * response carries a one-time temporary password; the user must change it at first login.
     */
    @PostMapping
    public ResponseEntity<AccountCreatedResponse> createUser(@RequestBody RegisterRequest request) {
        AdminAccountRequests.validate(validator, request);
        var created = userAccountService.createByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        new AccountCreatedResponse(
                                UserDTO.profileOf(created.user()), created.temporaryPassword()));
    }

    /** New temporary password for a user who forgot theirs; they must change it at next login. */
    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<AccountCreatedResponse> resetPassword(@PathVariable String userId) {
        String temporaryPassword = userAccountService.resetPassword(userId);
        return ResponseEntity.ok(
                new AccountCreatedResponse(
                        userAccountService.getProfile(userId), temporaryPassword));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Object> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userAccountService.getProfile(userId));
    }

    /** {"status": "ACTIVE" | "SUSPENDED" | "DEACTIVATED"} */
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserDTO> updateStatus(
            @PathVariable String userId, @Valid @RequestBody StatusUpdateRequest body) {
        return ResponseEntity.ok(userAccountService.updateStatus(userId, body.status()));
    }
}
