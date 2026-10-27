package com.careconnect.notification;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "notifications")
public class JpaNotificationEntity {
  @Id public UUID id;
  public UUID appointmentId;
  public String ownerSub;
  public String message;
  public String deliveryStatus;
  public String recipient;
  public Instant createdAt = Instant.now();

  public JpaNotificationEntity() {}
}
