package com.careconnect.insurance;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "verifications")
public class JpaVerificationEntity {
  @Id public UUID id = UUID.randomUUID();
  public UUID patientId;
  public String memberId;
  public String payer;
  public String status;
  public String source;
  public String reference;
  public int copay;
  public Instant checkedAt = Instant.now();

  public JpaVerificationEntity() {}
}
