package com.mediqueue.controller;

import com.mediqueue.dto.AlertRequest;
import com.mediqueue.dto.NotificationResponse;
import com.mediqueue.service.NotificationService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Every logged-in user reads their own notifications; only administrators send alerts. */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/mine")
    public ResponseEntity<NotificationResponse.Inbox> mine(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(notificationService.myInbox(limit));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable Long notificationId) {
        return ResponseEntity.ok(notificationService.markRead(notificationId));
    }

    @PatchMapping("/mine/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead() {
        return ResponseEntity.ok(Map.of("updated", notificationService.markAllRead()));
    }

    @PostMapping("/alert")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Integer>> sendAlert(
            @Valid @RequestBody AlertRequest request) {
        return ResponseEntity.ok(Map.of("sent", notificationService.sendAlert(request)));
    }

    /** Administrator: run the reminder job now instead of waiting for its next scheduled run. */
    @PostMapping("/reminders/run")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Integer>> runReminders() {
        return ResponseEntity.ok(
                Map.of("sent", notificationService.sendDueReminders(LocalDateTime.now())));
    }
}
