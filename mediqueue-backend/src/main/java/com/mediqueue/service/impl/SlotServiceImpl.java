package com.mediqueue.service.impl;

import com.mediqueue.dto.SlotSettingsDTO;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.SlotSettings;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.SlotSettingsRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.service.SlotService;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SlotServiceImpl implements SlotService {

    private static final Logger log = LoggerFactory.getLogger(SlotServiceImpl.class);

    private final SlotSettingsRepository settingsRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final DoctorRepository doctorRepository;

    public SlotServiceImpl(
            SlotSettingsRepository settingsRepository,
            TimeSlotRepository timeSlotRepository,
            DoctorRepository doctorRepository) {
        this.settingsRepository = settingsRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.doctorRepository = doctorRepository;
    }

    // ── settings ────────────────────────────────────────────────────────────

    @Override
    public SlotSettings settings() {
        return settingsRepository
                .findById(SlotSettings.SINGLETON_ID)
                .orElseGet(this::createDefaults);
    }

    /**
     * First start with this version: save the default settings and re-grid open slots, so slots
     * made by the old fixed generator (5 one-hour slots a day) are replaced by the configured grid.
     * Booked slots are never touched.
     */
    private SlotSettings createDefaults() {
        SlotSettings defaults = settingsRepository.save(new SlotSettings());
        int removed = withdrawOpen(null);
        log.info(
                "[SlotService] Created default slot settings; replaced {} open slot(s) from the old grid",
                removed);
        return defaults;
    }

    @Override
    @Transactional(readOnly = true)
    public SlotSettingsDTO getSettings() {
        return settingsRepository
                .findById(SlotSettings.SINGLETON_ID)
                .map(SlotSettingsDTO::from)
                .orElseGet(() -> SlotSettingsDTO.from(new SlotSettings()));
    }

    @Override
    public synchronized SlotSettingsDTO updateSettings(SlotSettingsDTO req) {
        validate(req);
        SlotSettings s = settings();
        s.setSlotMinutes(req.slotMinutes());
        s.setDayStart(req.dayStart());
        s.setDayEnd(req.dayEnd());
        s.setBreakStart(req.breakStart());
        s.setBreakEnd(req.breakEnd());
        s.setWorkingDaySet(EnumSet.copyOf(req.workingDays()));
        s.setBookingWindowDays(req.bookingWindowDays());
        s.setChangeCutoffHours(req.changeCutoffHours());
        settingsRepository.save(s);

        // Open slots move to the new grid; booked appointments keep their time.
        int withdrawn = withdrawOpen(null);
        int created = generateAll(s);
        log.info(
                "[SlotService] Settings updated: withdrew {} open slot(s), created {}",
                withdrawn,
                created);
        return SlotSettingsDTO.from(s);
    }

    private static void validate(SlotSettingsDTO r) {
        if (!r.dayStart().isBefore(r.dayEnd())) {
            throw new BadRequestException("End of day must be after start of day");
        }
        boolean hasBreakStart = r.breakStart() != null, hasBreakEnd = r.breakEnd() != null;
        if (hasBreakStart != hasBreakEnd) {
            throw new BadRequestException("Give both a break start and a break end, or neither");
        }
        if (hasBreakStart) {
            if (!r.breakStart().isBefore(r.breakEnd())) {
                throw new BadRequestException("Break end must be after break start");
            }
            if (r.breakStart().isBefore(r.dayStart()) || r.breakEnd().isAfter(r.dayEnd())) {
                throw new BadRequestException("The break must be inside working hours");
            }
        }
        if (dailyGrid(r.dayStart(), r.dayEnd(), r.breakStart(), r.breakEnd(), r.slotMinutes())
                .isEmpty()) {
            throw new BadRequestException(
                    "These hours leave no room for a single " + r.slotMinutes() + "-minute slot");
        }
    }

    // ── generation ──────────────────────────────────────────────────────────

    @Override
    public synchronized int generateForAllDoctors() {
        return generateAll(settings());
    }

    private int generateAll(SlotSettings s) {
        int created = 0;
        for (Doctor doctor : doctorRepository.findByAccountStatus(AccountStatus.ACTIVE)) {
            created += generate(doctor, s);
        }
        return created;
    }

    @Override
    public synchronized int generateForDoctor(Doctor doctor) {
        if (doctor.getAccountStatus() != AccountStatus.ACTIVE) return 0;
        return generate(doctor, settings());
    }

    private int generate(Doctor doctor, SlotSettings s) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDate lastDay = today.plusDays(s.getBookingWindowDays() - 1L);
        Set<DayOfWeek> workingDays = s.workingDaySet();
        List<LocalTime[]> grid =
                dailyGrid(
                        s.getDayStart(),
                        s.getDayEnd(),
                        s.getBreakStart(),
                        s.getBreakEnd(),
                        s.getSlotMinutes());

        // Every live slot the doctor already has in the window (open or booked); new ones must not
        // overlap.
        List<TimeSlot> taken =
                new ArrayList<>(
                        timeSlotRepository
                                .findByDoctor_UserIdAndStatusNotAndEndTimeGreaterThanAndStartTimeLessThan(
                                        doctor.getUserId(),
                                        SlotStatus.CANCELLED,
                                        today.atStartOfDay(),
                                        lastDay.plusDays(1).atStartOfDay()));

        List<TimeSlot> toCreate = new ArrayList<>();
        for (LocalDate day = today; !day.isAfter(lastDay); day = day.plusDays(1)) {
            if (!workingDays.contains(day.getDayOfWeek())) continue;
            for (LocalTime[] times : grid) {
                LocalDateTime start = day.atTime(times[0]);
                LocalDateTime end = day.atTime(times[1]);
                if (!start.isAfter(now)) continue; // never in the past
                if (overlapsAny(taken, start, end)) continue; // never on top of another slot
                TimeSlot slot = new TimeSlot();
                slot.setDoctor(doctor);
                slot.setStartTime(start);
                slot.setEndTime(end);
                slot.setStatus(SlotStatus.AVAILABLE);
                toCreate.add(slot);
                taken.add(slot);
            }
        }
        timeSlotRepository.saveAll(toCreate);
        return toCreate.size();
    }

    /** Start/end times of each slot in one working day. */
    private static List<LocalTime[]> dailyGrid(
            LocalTime dayStart,
            LocalTime dayEnd,
            LocalTime breakStart,
            LocalTime breakEnd,
            int minutes) {
        List<LocalTime[]> grid = new ArrayList<>();
        boolean hasBreak = breakStart != null && breakEnd != null;
        LocalTime t = dayStart;
        while (true) {
            LocalTime end = t.plusMinutes(minutes);
            if (!end.isAfter(t) || end.isAfter(dayEnd))
                break; // wrapped past midnight, or past closing
            if (hasBreak && t.isBefore(breakEnd) && end.isAfter(breakStart)) {
                t = breakEnd.isAfter(t) ? breakEnd : end; // skip over the break
                continue;
            }
            grid.add(new LocalTime[] {t, end});
            t = end;
        }
        return grid;
    }

    private static boolean overlapsAny(
            List<TimeSlot> slots, LocalDateTime start, LocalDateTime end) {
        for (TimeSlot s : slots) {
            if (s.getStartTime().isBefore(end) && s.getEndTime().isAfter(start)) return true;
        }
        return false;
    }

    // ── withdrawal ──────────────────────────────────────────────────────────

    @Override
    public void withdrawOpenSlots(String doctorId) {
        withdrawOpen(doctorId);
    }

    private int withdrawOpen(String doctorId) {
        LocalDateTime now = LocalDateTime.now();
        int deleted = timeSlotRepository.deleteUnusedOpenSlots(doctorId, now, SlotStatus.AVAILABLE);
        int withdrawn =
                timeSlotRepository.withdrawOpenSlots(
                        doctorId, now, SlotStatus.AVAILABLE, SlotStatus.CANCELLED);
        return deleted + withdrawn;
    }
}
