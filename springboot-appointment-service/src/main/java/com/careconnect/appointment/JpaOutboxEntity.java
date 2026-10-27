package com.careconnect.appointment;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "outbox_events")
public class JpaOutboxEntity {
  @Id public UUID id;

  @Column(nullable = false, columnDefinition = "text")
  public String payload;

  public boolean published;
  public Instant createdAt = Instant.now();

  public JpaOutboxEntity() {}

  public JpaOutboxEntity(UUID id, String payload) {
    this.id = id;
    this.payload = payload;
  }
}
