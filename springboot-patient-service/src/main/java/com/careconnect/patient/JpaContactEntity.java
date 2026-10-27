package com.careconnect.patient;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "patient_contacts")
public class JpaContactEntity {
  @Id public UUID id;
  public String label;
  public String value;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_id", nullable = false)
  @JsonIgnore
  public JpaPatientEntity patient;

  public JpaContactEntity() {}
}
