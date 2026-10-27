package com.careconnect.patient;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "patients")
public class JpaPatientEntity {
  @Id public UUID id;

  @Column(nullable = false)
  public String name;

  @Column(nullable = false, unique = true)
  public String email;

  @Column(nullable = false)
  public LocalDate dateOfBirth;

  public String phone;

  @Column(nullable = false)
  public String insurance;

  @Column(nullable = false, unique = true)
  public String memberId;

  @Column(nullable = false)
  public String ownerSub;

  @Version public long version;
  public Instant createdAt = Instant.now();

  // The relationship lives inside Patient Service; microservices never share JPA entities.
  @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
  @com.fasterxml.jackson.annotation.JsonIgnore
  public java.util.List<JpaContactEntity> contacts = new java.util.ArrayList<>();

  public JpaPatientEntity() {}
}
