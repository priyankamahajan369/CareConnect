package com.careconnect.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class KafkaNotificationListener {
  private final JpaNotificationRepository repo;
  private final ObjectMapper json;

  public KafkaNotificationListener(JpaNotificationRepository r, ObjectMapper j) {
    repo = r;
    json = j;
  }

  @KafkaListener(topics = "appointment.events")
  @Transactional
  public void accept(String payload) throws Exception {
    var event = json.readTree(payload);
    UUID id = UUID.fromString(event.required("eventId").asText());
    if (repo.existsById(id)) return;
    var n = new JpaNotificationEntity();
    n.id = id;
    n.appointmentId = UUID.fromString(event.required("appointmentId").asText());
    n.ownerSub = event.required("ownerSub").asText();
    n.recipient = event.required("email").asText();
    n.message =
        event.required("action").asText()
            + ": Appointment with "
            + event.required("providerName").asText()
            + " at "
            + event.required("startsAt").asText();
    n.deliveryStatus = "PENDING";
    repo.save(n);
  }
}
