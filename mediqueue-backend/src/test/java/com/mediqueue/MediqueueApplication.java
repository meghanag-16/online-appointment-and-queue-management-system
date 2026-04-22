package com.mediqueue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class MediqueueApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediqueueApplication.class, args);
    }
}
