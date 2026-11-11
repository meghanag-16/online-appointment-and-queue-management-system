package com.mediqueue.controller;

import com.mediqueue.dto.QueueEntryResponse;
import com.mediqueue.dto.QueuePositionRequest;
import com.mediqueue.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * The virtual queue. Doctors run their own queue (call next, start, finish, no-show); the front
 * desk can view and help; only administrators can override the order.
 */
@RestController
@RequestMapping("/api/v1/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    /** ?date=YYYY-MM-DD (default today). */
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<QueueEntryResponse>> getQueue(
            @PathVariable String doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(queueService.getQueue(doctorId, date));
    }

    @PostMapping("/doctor/{doctorId}/call-next")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<QueueEntryResponse> callNext(@PathVariable String doctorId) {
        return ResponseEntity.ok(queueService.callNext(doctorId));
    }

    @PostMapping("/entries/{queueId}/start")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<QueueEntryResponse> start(@PathVariable Long queueId) {
        return ResponseEntity.ok(queueService.start(queueId));
    }

    @PostMapping("/entries/{queueId}/finish")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<QueueEntryResponse> finish(@PathVariable Long queueId) {
        return ResponseEntity.ok(queueService.finish(queueId));
    }

    @PostMapping("/entries/{queueId}/no-show")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<Void> noShow(@PathVariable Long queueId) {
        queueService.markNoShow(queueId);
        return ResponseEntity.noContent().build();
    }

    /** Administrator override: {"position": 1} pins a waiting patient; {"position": null} clears it. */
    @PatchMapping("/entries/{queueId}/position")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<QueueEntryResponse>> override(@PathVariable Long queueId,
                                                             @Valid @RequestBody QueuePositionRequest body) {
        return ResponseEntity.ok(queueService.overridePosition(queueId, body.position()));
    }
}
