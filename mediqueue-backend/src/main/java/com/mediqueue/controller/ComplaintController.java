package com.mediqueue.controller;

import com.mediqueue.dto.ComplaintRequest;
import com.mediqueue.dto.ComplaintResponse;
import com.mediqueue.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ComplaintResponse> raiseComplaint(@Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.raise(request));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAll());
    }

    @PutMapping("/{complaintId}/resolve")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ComplaintResponse> resolveComplaint(@PathVariable String complaintId,
                                                              @RequestBody(required = false) Map<String, String> payload) {
        String resolution = payload != null ? payload.get("resolution") : null;
        return ResponseEntity.ok(complaintService.resolve(complaintId, resolution));
    }
}
