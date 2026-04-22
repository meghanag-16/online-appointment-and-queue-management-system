package com.mediqueue.controller;

import com.mediqueue.dto.UserDTO;
import com.mediqueue.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class AdminUsersController {

    private final UserRepository userRepository;

    public AdminUsersController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<Object[]> rawUsers = userRepository.findAllUsersRaw();
        List<UserDTO> users = rawUsers.stream()
            .map(row -> new UserDTO(
                (String) row[0],
                (String) row[1],
                (String) row[2],
                (String) row[3],
                (String) row[4],
                (String) row[5]
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}

