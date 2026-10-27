package com.careconnect.notification;

import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class RestNotificationController {
  private final JpaNotificationRepository repo;

  public RestNotificationController(JpaNotificationRepository r) {
    repo = r;
  }

  @GetMapping
  public List<JpaNotificationEntity> list(@AuthenticationPrincipal Jwt jwt) {
    Map<String, Object> realm = jwt.getClaim("realm_access");
    boolean staff =
        realm != null
            && realm.get("roles") instanceof Collection<?> roles
            && (roles.contains("STAFF") || roles.contains("ADMIN"));
    return staff
        ? repo.findTop50ByOrderByCreatedAtDesc()
        : repo.findTop50ByOwnerSubOrderByCreatedAtDesc(jwt.getSubject());
  }
}
