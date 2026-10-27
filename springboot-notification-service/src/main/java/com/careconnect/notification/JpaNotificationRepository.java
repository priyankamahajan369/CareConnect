package com.careconnect.notification;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaNotificationRepository extends JpaRepository<JpaNotificationEntity, UUID> {
  List<JpaNotificationEntity> findTop50ByOrderByCreatedAtDesc();

  List<JpaNotificationEntity> findTop50ByOwnerSubOrderByCreatedAtDesc(String owner);

  List<JpaNotificationEntity> findTop20ByDeliveryStatusOrderByCreatedAtAsc(String status);
}
