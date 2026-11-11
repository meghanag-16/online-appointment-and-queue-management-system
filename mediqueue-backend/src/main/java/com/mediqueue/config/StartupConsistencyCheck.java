package com.mediqueue.config;

import com.mediqueue.service.MedicalRecordService;
import com.mediqueue.service.impl.QueueManager;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs once at start-up (after the demo seeder): gives every patient a medical record and every
 * upcoming booking a queue entry, so data created before these features existed works straight
 * away.
 */
@Component
public class StartupConsistencyCheck {

    private static final Logger log = LoggerFactory.getLogger(StartupConsistencyCheck.class);

    private final MedicalRecordService medicalRecordService;
    private final QueueManager queueManager;

    public StartupConsistencyCheck(
            MedicalRecordService medicalRecordService, QueueManager queueManager) {
        this.medicalRecordService = medicalRecordService;
        this.queueManager = queueManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(10)
    public void run() {
        int records = medicalRecordService.createMissingRecords();
        if (records > 0) log.info("[Startup] Created {} missing medical record(s)", records);
        queueManager.rebuildFrom(LocalDate.now());
    }
}
