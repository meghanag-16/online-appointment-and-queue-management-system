package com.mediqueue.scheduler;

import com.mediqueue.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Every few minutes, sends a reminder for each booked or confirmed appointment that starts within
 * the next {@code app.reminders.hours-before} hours (24 by default) and has not had one yet.
 */
@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final NotificationService notificationService;

    public ReminderScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Scheduled(initialDelayString = "${app.reminders.initial-delay-ms:30000}",
               fixedDelayString = "${app.reminders.interval-ms:300000}")
    public void sendReminders() {
        try {
            notificationService.sendDueReminders(LocalDateTime.now());
        } catch (RuntimeException e) {
            log.error("[Reminders] Reminder run failed", e);
        }
    }
}
