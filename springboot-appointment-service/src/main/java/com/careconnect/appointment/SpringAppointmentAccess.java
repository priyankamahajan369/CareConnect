package com.careconnect.appointment;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component("appointmentAccess")
public class SpringAppointmentAccess {
  private final JpaAppointmentRepository repo;

  public SpringAppointmentAccess(JpaAppointmentRepository repo) {
    this.repo = repo;
  }

  public boolean owns(UUID id, String subject) {
    return repo.findById(id).map(a -> a.ownerSub.equals(subject)).orElse(false);
  }
}
