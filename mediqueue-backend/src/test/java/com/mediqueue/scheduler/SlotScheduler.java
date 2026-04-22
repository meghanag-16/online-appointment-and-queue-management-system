package com.mediqueue.scheduler;

import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.TimeSlotRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * SlotScheduler — automatically generates 5 available time slots
 * for every active doctor for the next 7 days.
 * Runs at startup AND every day at midnight.
 */
@Component
public class SlotScheduler {

    // 5 slot hours per day: 9am, 10am, 11am, 2pm, 3pm
    private static final int[] SLOT_HOURS = {9, 10, 11, 14, 15};

    private final DoctorRepository   doctorRepository;
    private final TimeSlotRepository timeSlotRepository;

    public SlotScheduler(DoctorRepository doctorRepository,
                         TimeSlotRepository timeSlotRepository) {
        this.doctorRepository   = doctorRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    /** Runs at startup — slots exist immediately when app launches */
    @jakarta.annotation.PostConstruct
    public void generateOnStartup() {
        generateSlotsForNextDays();
    }

    /** Runs every day at midnight to keep rolling 7-day window fresh */
    @Scheduled(cron = "0 0 0 * * *")
    public void generateDailySlots() {
        generateSlotsForNextDays();
    }

    @Transactional
    public void generateSlotsForNextDays() {
        List<Doctor> doctors = doctorRepository.findAll().stream()
            .filter(d -> d.getAccountStatus() == AccountStatus.ACTIVE)
            .toList();

        LocalDate today = LocalDate.now();

        for (Doctor doctor : doctors) {
            for (int dayOffset = 0; dayOffset <= 7; dayOffset++) {
                LocalDate targetDate = today.plusDays(dayOffset);

                for (int hour : SLOT_HOURS) {
                    LocalDateTime start = LocalDateTime.of(targetDate, LocalTime.of(hour, 0));

                    // Check if ANY slot (available or booked) already exists at this time
                    boolean alreadyExists = timeSlotRepository
                        .existsByDoctorUserIdAndStartTime(doctor.getUserId(), start);

                    if (!alreadyExists) {
                        TimeSlot slot = new TimeSlot();
                        slot.setDoctor(doctor);
                        slot.setStartTime(start);
                        slot.setEndTime(start.plusHours(1));
                        slot.setStatus(SlotStatus.AVAILABLE);
                        timeSlotRepository.save(slot);
                    }
                }
            }
        }
    }
}
