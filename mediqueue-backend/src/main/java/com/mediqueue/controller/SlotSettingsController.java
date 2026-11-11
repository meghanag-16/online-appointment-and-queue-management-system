package com.mediqueue.controller;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.SlotSettingsDTO;
import com.mediqueue.service.SlotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SlotSettingsController {

    private final SlotService slotService;
    private final AuditService auditService;

    public SlotSettingsController(SlotService slotService, AuditService auditService) {
        this.slotService = slotService;
        this.auditService = auditService;
    }

    /** Any logged-in user: booking pages show working hours and the cancel/reschedule cutoff. */
    @GetMapping("/settings/slots")
    public ResponseEntity<SlotSettingsDTO> get() {
        return ResponseEntity.ok(slotService.getSettings());
    }

    /**
     * Administrator: change slot length, hours, working days, window and cutoff; open slots are
     * regenerated.
     */
    @PutMapping("/admin/settings/slots")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<SlotSettingsDTO> update(@Valid @RequestBody SlotSettingsDTO request) {
        SlotSettingsDTO saved = slotService.updateSettings(request);
        auditService.record(
                AuditAction.SLOT_SETTINGS_CHANGED,
                "SLOT_SETTINGS",
                1,
                saved.slotMinutes()
                        + "-minute slots, "
                        + saved.dayStart()
                        + "–"
                        + saved.dayEnd()
                        + ", booking window "
                        + saved.bookingWindowDays()
                        + " days, cutoff "
                        + saved.changeCutoffHours()
                        + " h");
        return ResponseEntity.ok(saved);
    }
}
