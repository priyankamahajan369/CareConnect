package com.careconnect.appointment;

import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class RestAppointmentController {
  private final JpaAppointmentRepository repo;
  private final SpringAppointmentService service;
  private final JpaAuditRepository audit;

  public RestAppointmentController(
      JpaAppointmentRepository r, SpringAppointmentService s, JpaAuditRepository a) {
    repo = r;
    service = s;
    audit = a;
  }

  public record RestBookingRequest(
      @NotNull UUID patientId,
      @NotBlank @Size(max = 120) String providerId,
      @NotBlank @Size(max = 120) String providerName,
      @NotBlank String specialty,
      @NotNull Instant startsAt,
      @NotBlank @Pattern(regexp = "In person|Video visit") String visitType) {}

  @GetMapping("/appointments")
  public Page<JpaAppointmentEntity> list(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Map<String, Object> realm = jwt.getClaim("realm_access");
    boolean staff =
        realm != null
            && realm.get("roles") instanceof Collection<?> roles
            && (roles.contains("STAFF") || roles.contains("ADMIN"));
    return repo.search(
        staff ? null : jwt.getSubject(),
        status,
        q,
        PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100), Sort.by("startsAt")));
  }

  @PostMapping("/appointments")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('PATIENT','STAFF','ADMIN')")
  public JpaAppointmentEntity book(
      @Valid @RequestBody RestBookingRequest r,
      @RequestHeader("Idempotency-Key") String key,
      @AuthenticationPrincipal Jwt jwt) {
    return service.book(
        new SpringAppointmentService.Booking(
            r.patientId(),
            r.providerId(),
            r.providerName(),
            r.specialty(),
            r.startsAt(),
            r.visitType()),
        key,
        jwt.getTokenValue(),
        jwt.getSubject());
  }

  public record RestStatusRequest(
      @NotBlank @Pattern(regexp = "CANCELLED|COMPLETED") String status) {}

  @PatchMapping("/appointments/{id}/status")
  @PreAuthorize(
      "hasAnyRole('STAFF','ADMIN') or (#r.status() == 'CANCELLED' and @appointmentAccess.owns(#id,"
          + " authentication.name))")
  public JpaAppointmentEntity status(
      @PathVariable UUID id,
      @Valid @RequestBody RestStatusRequest r,
      @AuthenticationPrincipal Jwt jwt) {
    return service.transition(id, r.status(), jwt.getSubject());
  }

  @GetMapping("/audit")
  @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
  public List<JpaAuditEntity> audit() {
    return audit.findTop50ByOrderByCreatedAtDesc();
  }
}
