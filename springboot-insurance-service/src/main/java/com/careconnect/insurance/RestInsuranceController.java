package com.careconnect.insurance;

import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasAnyRole('STAFF','ADMIN')")
public class RestInsuranceController {
  private final JpaVerificationRepository repo;
  private final RestProviderClient providers;

  public RestInsuranceController(JpaVerificationRepository r, RestProviderClient p) {
    repo = r;
    providers = p;
  }

  @GetMapping("/providers")
  @PreAuthorize("isAuthenticated()")
  @Cacheable(value = "providers", key = "#state + ':' + #name")
  public Map<String, Object> providers(
      @RequestParam(defaultValue = "NY") @Pattern(regexp = "[A-Z]{2}") String state,
      @RequestParam(defaultValue = "") @Size(max = 60) String name) {
    return providers.search(state, name);
  }

  public record RestVerificationRequest(
      @NotNull UUID patientId,
      @NotBlank @Size(max = 50) String memberId,
      @NotBlank @Size(max = 100) String payer) {}

  @PostMapping("/verifications")
  public JpaVerificationEntity verify(@Valid @RequestBody RestVerificationRequest r) {
    // No claim of real coverage: deterministic synthetic response only.
    var v = new JpaVerificationEntity();
    v.patientId = r.patientId();
    v.memberId = r.memberId();
    v.payer = r.payer();
    v.status = r.memberId().toUpperCase().startsWith("INACTIVE") ? "INACTIVE" : "ACTIVE";
    v.source = "SIMULATED ELIGIBILITY — NOT A COVERAGE DECISION";
    v.copay = v.status.equals("ACTIVE") ? 25 : 0;
    v.reference = "SIM-" + v.id.toString().substring(0, 8);
    return repo.save(v);
  }

  @GetMapping("/verifications")
  public List<JpaVerificationEntity> list() {
    return repo.findTop50ByOrderByCheckedAtDesc();
  }
}
