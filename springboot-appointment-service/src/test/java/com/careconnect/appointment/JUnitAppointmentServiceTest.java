package com.careconnect.appointment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

class JUnitAppointmentServiceTest {
  JpaAppointmentRepository repo = mock(JpaAppointmentRepository.class);
  RestPatientClient patients = mock(RestPatientClient.class);
  JpaOutboxRepository outbox = mock(JpaOutboxRepository.class);
  JpaAuditRepository audit = mock(JpaAuditRepository.class);
  SpringAppointmentService service =
      new SpringAppointmentService(repo, patients, outbox, audit, new ObjectMapper());

  @Test
  void repeatedKeyReturnsOriginalWithoutCallingPatientService() {
    var a = new JpaAppointmentEntity();
    var r =
        new SpringAppointmentService.Booking(
            UUID.randomUUID(),
            "p",
            "Dr Demo",
            "Family",
            Instant.parse("2099-01-01T10:00:00Z"),
            "In person");
    a.requestHash = hash(r.toString());
    when(repo.findByIdempotencyKey("test-key-123")).thenReturn(Optional.of(a));
    assertSame(a, service.book(r, "test-key-123", "token", "staff"));
    verifyNoInteractions(patients, outbox, audit);
  }

  @Test
  void reusedKeyWithChangedBodyIsRejected() {
    var a = new JpaAppointmentEntity();
    a.requestHash = "different";
    when(repo.findByIdempotencyKey("test-key-123")).thenReturn(Optional.of(a));
    assertThrows(
        IllegalStateException.class,
        () ->
            service.book(
                new SpringAppointmentService.Booking(
                    UUID.randomUUID(),
                    "p",
                    "Dr Demo",
                    "Family",
                    Instant.now().plusSeconds(9999),
                    "In person"),
                "test-key-123",
                "token",
                "staff"));
  }

  @Test
  void rejectsPastBooking() {
    when(repo.findByIdempotencyKey(any())).thenReturn(Optional.empty());
    assertThrows(
        IllegalArgumentException.class,
        () ->
            service.book(
                new SpringAppointmentService.Booking(
                    UUID.randomUUID(),
                    "p",
                    "Dr Demo",
                    "Family",
                    Instant.now().minusSeconds(60),
                    "In person"),
                "test-key-123",
                "token",
                "staff"));
    verifyNoInteractions(patients);
  }

  @Test
  void createsOutboxAndAuditWithBooking() {
    var id = UUID.randomUUID();
    when(repo.findByIdempotencyKey(any())).thenReturn(Optional.empty());
    when(patients.get(id, "token"))
        .thenReturn(
            new RestPatientClient.RestPatientSummary(
                id, "Maya", "maya@example.test", "patient-demo"));
    var a =
        service.book(
            new SpringAppointmentService.Booking(
                id,
                "demo",
                "Dr Demo",
                "Family",
                Instant.parse("2099-01-01T10:00:00Z"),
                "In person"),
            "test-key-123",
            "token",
            "staff");
    assertEquals("CONFIRMED", a.status);
    verify(outbox).save(any());
    verify(audit).save(any());
  }

  private String hash(String s) {
    try {
      return java.util.HexFormat.of()
          .formatHex(
              java.security.MessageDigest.getInstance("SHA-256")
                  .digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
