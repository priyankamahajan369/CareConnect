package com.careconnect.patient;

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
@RequestMapping("/api/v1/patients")
public class RestPatientController {
  private final JpaPatientRepository repo;

  public RestPatientController(JpaPatientRepository repo) {
    this.repo = repo;
  }

  public record RestPatientRequest(
      @NotBlank @Size(max = 120) String name,
      @NotBlank @Email String email,
      @NotNull @Past LocalDate dateOfBirth,
      @Size(max = 30) String phone,
      @NotBlank String insurance,
      @NotBlank String memberId,
      @NotBlank String ownerSub) {}

  @GetMapping
  @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
  public Page<JpaPatientEntity> list(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return repo.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
        q, q, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("name")));
  }

  @GetMapping("/me")
  public List<JpaPatientEntity> me(@AuthenticationPrincipal Jwt jwt) {
    return repo.findByOwnerSub(jwt.getSubject());
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('STAFF','ADMIN') or @patientAccess.owns(#id, authentication.name)")
  public JpaPatientEntity get(@PathVariable UUID id) {
    return repo.findById(id).orElseThrow(() -> new NoSuchElementException("Patient not found"));
  }

  public record RestContact(java.util.UUID id, String label, String value) {}

  @GetMapping("/{id}/contacts")
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  @PreAuthorize("hasAnyRole('STAFF','ADMIN') or @patientAccess.owns(#id, authentication.name)")
  public java.util.List<RestContact> contacts(@PathVariable UUID id) {
    return get(id).contacts.stream().map(c -> new RestContact(c.id, c.label, c.value)).toList();
  }

  @PostMapping
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
  public JpaPatientEntity create(@Valid @RequestBody RestPatientRequest r) {
    var p = new JpaPatientEntity();
    p.id = UUID.randomUUID();
    p.name = r.name();
    p.email = r.email();
    p.dateOfBirth = r.dateOfBirth();
    p.phone = r.phone();
    p.insurance = r.insurance();
    p.memberId = r.memberId();
    p.ownerSub = r.ownerSub();
    if (p.phone != null && !p.phone.isBlank()) {
      var contact = new JpaContactEntity();
      contact.id = UUID.randomUUID();
      contact.label = "Mobile";
      contact.value = p.phone;
      contact.patient = p;
      p.contacts.add(contact);
    }
    return repo.save(p);
  }
}
