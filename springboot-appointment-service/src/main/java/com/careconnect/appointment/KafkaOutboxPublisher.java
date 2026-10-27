package com.careconnect.appointment;

import java.util.concurrent.TimeUnit;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class KafkaOutboxPublisher {
  private final JpaOutboxRepository repo;
  private final KafkaTemplate<String, String> kafka;

  public KafkaOutboxPublisher(JpaOutboxRepository repo, KafkaTemplate<String, String> kafka) {
    this.repo = repo;
    this.kafka = kafka;
  }

  // Delivery is at least once: consumers deduplicate by event ID after broker acknowledgement.
  @Scheduled(fixedDelay = 3000)
  @Transactional
  public void publish() throws Exception {
    for (var e : repo.claimBatch()) {
      kafka.send("appointment.events", e.id.toString(), e.payload).get(10, TimeUnit.SECONDS);
      e.published = true;
      repo.save(e);
    }
  }
}
