package com.mediqueue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // required for SlotScheduler's daily slot generation
public class MediqueueApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediqueueApplication.class, args);
    }
}
