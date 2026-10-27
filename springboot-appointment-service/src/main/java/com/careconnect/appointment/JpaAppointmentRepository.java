package com.careconnect.appointment;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface JpaAppointmentRepository extends JpaRepository<JpaAppointmentEntity, UUID> {
  Optional<JpaAppointmentEntity> findByIdempotencyKey(String key);

  @Query(
      "select a from JpaAppointmentEntity a where (:owner is null or a.ownerSub=:owner) and"
          + " (:status='' or a.status=:status) and lower(a.patientName) like"
          + " lower(concat('%',:q,'%'))")
  Page<JpaAppointmentEntity> search(
      @Param("owner") String owner,
      @Param("status") String status,
      @Param("q") String q,
      Pageable pageable);
}
