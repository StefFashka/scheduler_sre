package ru.uchebnyradar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UchebnyRadarApplication {

    public static void main(String[] args) {
        SpringApplication.run(UchebnyRadarApplication.class, args);
    }
}
