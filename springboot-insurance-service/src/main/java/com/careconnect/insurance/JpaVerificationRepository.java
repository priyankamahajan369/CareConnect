package com.careconnect.insurance;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaVerificationRepository extends JpaRepository<JpaVerificationEntity, UUID> {
  List<JpaVerificationEntity> findTop50ByOrderByCheckedAtDesc();
}
