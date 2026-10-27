package com.careconnect.appointment;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "appointments")
public class JpaAppointmentEntity {
  @Id public UUID id;

  @Column(nullable = false)
  public UUID patientId;

  @Column(nullable = false)
  public String patientName;

  @Column(nullable = false)
  public String patientEmail;

  @Column(nullable = false)
  public String ownerSub;

  @Column(nullable = false)
  public String providerId;

  @Column(nullable = false)
  public String providerName;

  @Column(nullable = false)
  public String specialty;

  @Column(nullable = false)
  public Instant startsAt;

  @Column(nullable = false)
  public String status;

  @Column(nullable = false)
  public String visitType;

  @Column(nullable = false, unique = true)
  public String idempotencyKey;

  @Column(nullable = false)
  public String requestHash;

  @Version public long version;
  public Instant createdAt = Instant.now();

  public JpaAppointmentEntity() {}
}
