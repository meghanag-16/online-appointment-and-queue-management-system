package com.mediqueue.controller;

import com.mediqueue.dto.ComplaintRequest;
import com.mediqueue.dto.ComplaintResponse;
import com.mediqueue.dto.ComplaintStatusRequest;
import com.mediqueue.service.ComplaintService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ComplaintResponse> raiseComplaint(
            @Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.raise(request));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<ComplaintResponse>> myComplaints() {
        return ResponseEntity.ok(complaintService.getMine());
    }

    /** ?status=OPEN | UNDER_REVIEW | RESOLVED (optional). */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(complaintService.getAll(status));
    }

    @PatchMapping("/{complaintId}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable String complaintId, @Valid @RequestBody ComplaintStatusRequest request) {
        return ResponseEntity.ok(complaintService.updateStatus(complaintId, request));
    }
}
