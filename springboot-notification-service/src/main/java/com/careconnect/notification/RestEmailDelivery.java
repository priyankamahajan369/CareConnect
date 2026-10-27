package com.careconnect.notification;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Component
public class RestEmailDelivery {
  private final JpaNotificationRepository repo;
  private final RestClient client;
  private final String mode, key, from;
  private static final Logger log = LoggerFactory.getLogger(RestEmailDelivery.class);

  public RestEmailDelivery(
      JpaNotificationRepository r,
      @Value("${careconnect.email-url}") String url,
      @Value("${careconnect.integration-mode}") String mode,
      @Value("${careconnect.email-key}") String key,
      @Value("${careconnect.email-from}") String from,
      RestClient.Builder builder) {
    repo = r;
    this.mode = mode;
    this.key = key;
    this.from = from;
    var f =
        new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    f.setReadTimeout(Duration.ofSeconds(5));
    client = builder.baseUrl(url).requestFactory(f).build();
  }

  // A stable provider idempotency key prevents duplicate email after a crash/retry.
  @Scheduled(fixedDelay = 5000)
  @Transactional
  public void deliver() {
    for (var n : repo.findTop20ByDeliveryStatusOrderByCreatedAtAsc("PENDING"))
      try {
        if (mode.equals("mock")) {
          n.deliveryStatus = "SIMULATED";
        } else {
          if (key.isBlank())
            throw new IllegalStateException("EMAIL_API_KEY is required for live delivery");
          client
              .post()
              .uri("/emails")
              .header("Authorization", "Bearer " + key)
              .header("Idempotency-Key", n.id.toString())
              .body(
                  Map.of(
                      "from",
                      from,
                      "to",
                      List.of(n.recipient),
                      "subject",
                      "CareConnect appointment update",
                      "text",
                      n.message))
              .retrieve()
              .toBodilessEntity();
          n.deliveryStatus = "SENT";
        }
        repo.save(n);
      } catch (Exception e) {
        log.warn("Email delivery pending retry; eventId={}", n.id);
      }
  }
}
