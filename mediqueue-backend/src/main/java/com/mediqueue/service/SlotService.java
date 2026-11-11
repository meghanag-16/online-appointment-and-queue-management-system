package com.mediqueue.service;

import com.mediqueue.dto.SlotSettingsDTO;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.SlotSettings;

/**
 * Owns time-slot generation and the administrator's slot settings.
 *
 * <p>Slots are generated for every ACTIVE doctor over a rolling window (bookingWindowDays), on the
 * configured working days and hours, skipping the break, never in the past and never overlapping a
 * slot the doctor already has. Deactivated or suspended doctors get no slots.
 */
public interface SlotService {

    /** Current settings (created with defaults on first use). */
    SlotSettings settings();

    SlotSettingsDTO getSettings();

    /**
     * Saves new settings, withdraws open (unbooked) future slots and regenerates them on the new
     * grid.
     */
    SlotSettingsDTO updateSettings(SlotSettingsDTO request);

    /** Fills the rolling window for every active doctor. Returns the number of slots created. */
    int generateForAllDoctors();

    /** Fills the rolling window for one doctor (if active). Returns the number of slots created. */
    int generateForDoctor(Doctor doctor);

    /** Removes a doctor's open future slots (used when the doctor is deactivated or suspended). */
    void withdrawOpenSlots(String doctorId);
}
