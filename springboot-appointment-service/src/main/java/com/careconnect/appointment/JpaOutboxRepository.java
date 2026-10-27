package com.careconnect.appointment;

import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface JpaOutboxRepository extends JpaRepository<JpaOutboxEntity, UUID> {
  @Query(
      value =
          "select * from outbox_events where published=false order by created_at limit 20 for"
              + " update skip locked",
      nativeQuery = true)
  List<JpaOutboxEntity> claimBatch();
}
