package com.mediqueue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling // required for SlotScheduler's nightly slot generation
public class MediqueueApplication {

    /** The hospital's time zone. "Today", slot times and the cancel cutoff are all in this zone. */
    public static final String DEFAULT_TIME_ZONE = "Asia/Kolkata";

    public static void main(String[] args) {
        // Set before Spring starts so LocalDate.now()/LocalDateTime.now() mean hospital time even when
        // the server or container runs in UTC. Override with the APP_TIMEZONE environment variable.
        String zone = System.getenv().getOrDefault("APP_TIMEZONE", DEFAULT_TIME_ZONE);
        TimeZone.setDefault(TimeZone.getTimeZone(zone));
        SpringApplication.run(MediqueueApplication.class, args);
    }
}
