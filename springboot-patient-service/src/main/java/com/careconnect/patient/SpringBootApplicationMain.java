package com.careconnect.patient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.careconnect")
@EnableScheduling
@EnableCaching
public class SpringBootApplicationMain {
  public static void main(String[] args) {
    SpringApplication.run(SpringBootApplicationMain.class, args);
  }
}
