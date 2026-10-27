package com.careconnect.appointment;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaAuditRepository extends JpaRepository<JpaAuditEntity, UUID> {
  List<JpaAuditEntity> findTop50ByOrderByCreatedAtDesc();
}
