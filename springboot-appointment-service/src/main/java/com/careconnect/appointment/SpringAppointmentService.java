package com.careconnect.appointment;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SpringAppointmentService {
  private final JpaAppointmentRepository repo;
  private final RestPatientClient patients;
  private final JpaOutboxRepository outbox;
  private final JpaAuditRepository audit;
  private final ObjectMapper json;

  public SpringAppointmentService(
      JpaAppointmentRepository r,
      RestPatientClient p,
      JpaOutboxRepository o,
      JpaAuditRepository a,
      ObjectMapper j) {
    repo = r;
    patients = p;
    outbox = o;
    audit = a;
    json = j;
  }

  public record Booking(
      UUID patientId,
      String providerId,
      String providerName,
      String specialty,
      Instant startsAt,
      String visitType) {}

  @Transactional
  public JpaAppointmentEntity book(Booking r, String key, String token, String actor) {
    if (key == null || !key.matches("[a-zA-Z0-9-]{8,100}"))
      throw new IllegalArgumentException("A valid Idempotency-Key header is required");
    String hash = hash(r.toString());
    var previous = repo.findByIdempotencyKey(key);
    if (previous.isPresent()) {
      if (!previous.get().requestHash.equals(hash))
        throw new IllegalStateException("Idempotency key reused with different data");
      return previous.get();
    }
    if (!r.startsAt().isAfter(Instant.now()))
      throw new IllegalArgumentException("Choose a future appointment");
    // Fixed 30-minute UTC slots make the database unique index a concurrency-safe booking guard.
    if (r.startsAt().getEpochSecond() % 1800 != 0 || r.startsAt().getNano() != 0)
      throw new IllegalArgumentException("Appointments must begin on a 30-minute boundary");
    var patient = patients.get(r.patientId(), token);
    var a = new JpaAppointmentEntity();
    a.id = UUID.randomUUID();
    a.patientId = r.patientId();
    a.patientName = patient.name();
    a.patientEmail = patient.email();
    a.ownerSub = patient.ownerSub();
    a.providerId = r.providerId();
    a.providerName = r.providerName();
    a.specialty = r.specialty();
    a.startsAt = r.startsAt();
    a.visitType = r.visitType();
    a.status = "CONFIRMED";
    a.idempotencyKey = key;
    a.requestHash = hash;
    repo.saveAndFlush(a);
    event(a, "BOOKED", actor);
    return a;
  }

  @Transactional
  public JpaAppointmentEntity transition(UUID id, String target, String actor) {
    var a =
        repo.findById(id).orElseThrow(() -> new NoSuchElementException("Appointment not found"));
    if (!a.status.equals("CONFIRMED") || !Set.of("CANCELLED", "COMPLETED").contains(target))
      throw new IllegalStateException("Only a confirmed appointment can be cancelled or completed");
    if (target.equals("COMPLETED") && a.startsAt.isAfter(Instant.now()))
      throw new IllegalStateException("A future appointment cannot be completed");
    a.status = target;
    event(a, target, actor);
    return repo.save(a);
  }

  private void event(JpaAppointmentEntity a, String action, String actor) {
    UUID id = UUID.randomUUID();
    try {
      outbox.save(
          new JpaOutboxEntity(
              id,
              json.writeValueAsString(
                  Map.of(
                      "eventId",
                      id,
                      "appointmentId",
                      a.id,
                      "patientId",
                      a.patientId,
                      "ownerSub",
                      a.ownerSub,
                      "email",
                      a.patientEmail,
                      "patientName",
                      a.patientName,
                      "providerName",
                      a.providerName,
                      "startsAt",
                      a.startsAt.toString(),
                      "action",
                      action))));
    } catch (Exception e) {
      throw new IllegalStateException("Cannot record appointment event", e);
    }
    audit.save(new JpaAuditEntity(actor, action, a.id));
  }

  private String hash(String s) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
