package com.mediqueue.entity;

import jakarta.persistence.*;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Hospital-wide scheduling settings, edited by the administrator (single row, id = 1).
 * The slot generator and the cancel/reschedule rule read from here.
 */
@Entity
@Table(name = "slot_settings")
public class SlotSettings {

    public static final int SINGLETON_ID = 1;

    @Id
    @Column(name = "settings_id")
    private Integer settingsId = SINGLETON_ID;

    /** Length of one appointment slot, in minutes. */
    @Column(name = "slot_minutes", nullable = false)
    private Integer slotMinutes = 30;

    @Column(name = "day_start", nullable = false)
    private LocalTime dayStart = LocalTime.of(9, 0);

    @Column(name = "day_end", nullable = false)
    private LocalTime dayEnd = LocalTime.of(17, 0);

    /** Optional lunch break with no slots; both null = no break. */
    @Column(name = "break_start")
    private LocalTime breakStart = LocalTime.of(13, 0);

    @Column(name = "break_end")
    private LocalTime breakEnd = LocalTime.of(14, 0);

    /** Comma-separated DayOfWeek names, e.g. "MONDAY,TUESDAY". */
    @Column(name = "working_days", nullable = false, length = 80)
    private String workingDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY";

    /** How many days ahead (including today) patients can book. */
    @Column(name = "booking_window_days", nullable = false)
    private Integer bookingWindowDays = 7;

    /** Patients cannot cancel or reschedule within this many hours of the slot. */
    @Column(name = "change_cutoff_hours", nullable = false)
    private Integer changeCutoffHours = 2;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() { updatedAt = LocalDateTime.now(); }

    public Set<DayOfWeek> workingDaySet() {
        if (workingDays == null || workingDays.isBlank()) return EnumSet.noneOf(DayOfWeek.class);
        return Arrays.stream(workingDays.split(","))
            .map(s -> DayOfWeek.valueOf(s.trim().toUpperCase(Locale.ROOT)))
            .collect(Collectors.toCollection(() -> EnumSet.noneOf(DayOfWeek.class)));
    }

    public void setWorkingDaySet(Set<DayOfWeek> days) {
        workingDays = days.stream().sorted().map(DayOfWeek::name).collect(Collectors.joining(","));
    }

    public boolean hasBreak() { return breakStart != null && breakEnd != null; }

    public Integer getSettingsId() { return settingsId; }
    public void setSettingsId(Integer settingsId) { this.settingsId = settingsId; }

    public Integer getSlotMinutes() { return slotMinutes; }
    public void setSlotMinutes(Integer slotMinutes) { this.slotMinutes = slotMinutes; }

    public LocalTime getDayStart() { return dayStart; }
    public void setDayStart(LocalTime dayStart) { this.dayStart = dayStart; }

    public LocalTime getDayEnd() { return dayEnd; }
    public void setDayEnd(LocalTime dayEnd) { this.dayEnd = dayEnd; }

    public LocalTime getBreakStart() { return breakStart; }
    public void setBreakStart(LocalTime breakStart) { this.breakStart = breakStart; }

    public LocalTime getBreakEnd() { return breakEnd; }
    public void setBreakEnd(LocalTime breakEnd) { this.breakEnd = breakEnd; }

    public String getWorkingDays() { return workingDays; }
    public void setWorkingDays(String workingDays) { this.workingDays = workingDays; }

    public Integer getBookingWindowDays() { return bookingWindowDays; }
    public void setBookingWindowDays(Integer bookingWindowDays) { this.bookingWindowDays = bookingWindowDays; }

    public Integer getChangeCutoffHours() { return changeCutoffHours; }
    public void setChangeCutoffHours(Integer changeCutoffHours) { this.changeCutoffHours = changeCutoffHours; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
