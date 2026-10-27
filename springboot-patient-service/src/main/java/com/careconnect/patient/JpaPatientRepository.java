package com.careconnect.patient;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;

public interface JpaPatientRepository extends JpaRepository<JpaPatientEntity, UUID> {
  Page<JpaPatientEntity> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
      String name, String email, Pageable pageable);

  List<JpaPatientEntity> findByOwnerSub(String ownerSub);
}
