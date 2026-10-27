package com.careconnect.appointment;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "audit_records")
public class JpaAuditEntity {
  @Id public UUID id = UUID.randomUUID();
  public String actor;
  public String action;
  public UUID aggregateId;
  public Instant createdAt = Instant.now();

  public JpaAuditEntity() {}

  public JpaAuditEntity(String actor, String action, UUID id) {
    this.actor = actor;
    this.action = action;
    this.aggregateId = id;
  }
}
