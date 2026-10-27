package com.careconnect.appointment;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class RestPatientClient {
  private final RestClient client;

  public RestPatientClient(
      @Value("${careconnect.patient-url}") String url, RestClient.Builder builder) {
    var f =
        new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    f.setReadTimeout(Duration.ofSeconds(5));
    client = builder.baseUrl(url).requestFactory(f).build();
  }

  public record RestPatientSummary(UUID id, String name, String email, String ownerSub) {}

  public RestPatientSummary get(UUID id, String token) {
    return client
        .get()
        .uri("/api/v1/patients/{id}", id)
        .headers(
            h -> {
              h.setBearerAuth(token);
              String correlationId = org.slf4j.MDC.get("correlationId");
              if (correlationId != null) h.set("X-Correlation-ID", correlationId);
            })
        .retrieve()
        .body(RestPatientSummary.class);
  }
}
