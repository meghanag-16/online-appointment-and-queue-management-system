package com.mediqueue.controller;

import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.dto.StatusUpdateRequest;
import com.mediqueue.dto.UserDTO;
import com.mediqueue.service.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Administrator user management: list, create (any role), view profile, activate/suspend/deactivate. */
@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminUsersController {

    private final UserAccountService userAccountService;

    public AdminUsersController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userAccountService.listUsers());
    }

    /** The only way to create doctor, lab technician, receptionist and administrator accounts. */
    @PostMapping
    public ResponseEntity<Object> createUser(@Valid @RequestBody RegisterRequest request) {
        var user = userAccountService.createByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDTO.profileOf(user));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Object> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userAccountService.getProfile(userId));
    }

    /** {"status": "ACTIVE" | "SUSPENDED" | "DEACTIVATED"} */
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserDTO> updateStatus(@PathVariable String userId,
                                                @Valid @RequestBody StatusUpdateRequest body) {
        return ResponseEntity.ok(userAccountService.updateStatus(userId, body.status()));
    }
}
