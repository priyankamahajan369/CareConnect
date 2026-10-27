package com.careconnect.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.cloud.gateway.route.*;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.*;

@SpringBootApplication
public class SpringGatewayApplication {
  public static void main(String[] args) {
    SpringApplication.run(SpringGatewayApplication.class, args);
  }

  @Bean
  RouteLocator routes(
      RouteLocatorBuilder b,
      @Value("${PATIENT_URL:http://localhost:8081}") String p,
      @Value("${APPOINTMENT_URL:http://localhost:8082}") String a,
      @Value("${INSURANCE_URL:http://localhost:8083}") String i,
      @Value("${NOTIFICATION_URL:http://localhost:8084}") String n) {
    return b.routes()
        .route("patients", r -> r.path("/api/v1/patients/**").uri(p))
        .route("appointments", r -> r.path("/api/v1/appointments/**", "/api/v1/audit").uri(a))
        .route("insurance", r -> r.path("/api/v1/providers", "/api/v1/verifications/**").uri(i))
        .route("notifications", r -> r.path("/api/v1/notifications/**").uri(n))
        .build();
  }
}
