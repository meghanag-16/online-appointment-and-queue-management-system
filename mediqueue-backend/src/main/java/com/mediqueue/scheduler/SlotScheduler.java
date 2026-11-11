package com.mediqueue.scheduler;

import com.mediqueue.service.SlotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Keeps every active doctor's rolling booking window filled with slots, using the
 * administrator's slot settings (see {@link SlotService}). Runs at startup and every night.
 */
@Component
public class SlotScheduler {

    private static final Logger log = LoggerFactory.getLogger(SlotScheduler.class);

    private final SlotService slotService;

    public SlotScheduler(SlotService slotService) {
        this.slotService = slotService;
    }

    /**
     * ApplicationReadyEvent (not @PostConstruct) so it runs AFTER DataSeeder has created the demo
     * doctors on a fresh database.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void generateOnStartup() {
        log.info("[SlotScheduler] Startup: created {} slot(s)", slotService.generateForAllDoctors());
    }

    /** Just after midnight (server time zone): adds the new last day of the window. */
    @Scheduled(cron = "0 1 0 * * *")
    public void generateDaily() {
        log.info("[SlotScheduler] Nightly run: created {} slot(s)", slotService.generateForAllDoctors());
    }
}
