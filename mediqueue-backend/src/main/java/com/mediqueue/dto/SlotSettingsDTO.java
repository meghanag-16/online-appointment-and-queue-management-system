package com.mediqueue.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.mediqueue.entity.SlotSettings;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

/**
 * Slot settings as shown to and edited by the administrator. Read by every role so the booking
 * pages can show the working hours and the cancel/reschedule cutoff.
 */
public record SlotSettingsDTO(
        @NotNull(message = "Slot length is required")
                @Min(value = 10, message = "Slot length must be at least 10 minutes")
                @Max(value = 240, message = "Slot length must be at most 240 minutes")
                Integer slotMinutes,
        @NotNull(message = "Start of day is required") @JsonFormat(pattern = "HH:mm")
                LocalTime dayStart,
        @NotNull(message = "End of day is required") @JsonFormat(pattern = "HH:mm")
                LocalTime dayEnd,
        @JsonFormat(pattern = "HH:mm") LocalTime breakStart,
        @JsonFormat(pattern = "HH:mm") LocalTime breakEnd,
        @NotEmpty(message = "Pick at least one working day") Set<DayOfWeek> workingDays,
        @NotNull(message = "Booking window is required")
                @Min(value = 1, message = "Booking window must be at least 1 day")
                @Max(value = 60, message = "Booking window must be at most 60 days")
                Integer bookingWindowDays,
        @NotNull(message = "Cancel/reschedule cutoff is required")
                @Min(value = 0, message = "Cutoff cannot be negative")
                @Max(value = 72, message = "Cutoff must be at most 72 hours")
                Integer changeCutoffHours) {
    public static SlotSettingsDTO from(SlotSettings s) {
        return new SlotSettingsDTO(
                s.getSlotMinutes(),
                s.getDayStart(),
                s.getDayEnd(),
                s.getBreakStart(),
                s.getBreakEnd(),
                s.workingDaySet(),
                s.getBookingWindowDays(),
                s.getChangeCutoffHours());
    }
}
