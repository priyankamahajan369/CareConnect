package com.careconnect.patient;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component("patientAccess")
public class SpringPatientAccess {
  private final JpaPatientRepository repo;

  public SpringPatientAccess(JpaPatientRepository repo) {
    this.repo = repo;
  }

  public boolean owns(UUID id, String sub) {
    return repo.findById(id).map(p -> p.ownerSub.equals(sub)).orElse(false);
  }
}
