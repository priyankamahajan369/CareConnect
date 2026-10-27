package com.careconnect.insurance;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class RestProviderClient {
  private final RestClient client;
  private final String mode;

  public RestProviderClient(String url, String mode) {
    this(url, mode, RestClient.builder());
  }

  @org.springframework.beans.factory.annotation.Autowired
  public RestProviderClient(
      @Value("${careconnect.npi-url}") String url,
      @Value("${careconnect.integration-mode}") String mode,
      RestClient.Builder builder) {
    this.mode = mode;
    var f =
        new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    f.setReadTimeout(Duration.ofSeconds(5));
    client = builder.baseUrl(url).requestFactory(f).build();
  }

  @CircuitBreaker(name = "providerRegistry")
  @Retry(name = "providerRegistry")
  public Map<String, Object> search(String state, String name) {
    if (mode.equals("mock"))
      return Map.of(
          "source",
          "SIMULATED NPI DIRECTORY",
          "results",
          List.of(
                  Map.of(
                      "id",
                      "demo-rivera",
                      "name",
                      "Dr. Elena Rivera",
                      "specialty",
                      "Family Medicine",
                      "city",
                      "New York",
                      "state",
                      "NY"),
                  Map.of(
                      "id",
                      "demo-morgan",
                      "name",
                      "Dr. James Morgan",
                      "specialty",
                      "Cardiology",
                      "city",
                      "White Plains",
                      "state",
                      "NY"),
                  Map.of(
                      "id",
                      "demo-shah",
                      "name",
                      "Dr. Priya Shah",
                      "specialty",
                      "Dermatology",
                      "city",
                      "Scarsdale",
                      "state",
                      "NY"))
              .stream()
              .filter(
                  p ->
                      p.get("state").equals(state)
                          && p.get("name")
                              .toLowerCase(java.util.Locale.ROOT)
                              .contains(name.toLowerCase(java.util.Locale.ROOT)))
              .toList());
    Map<?, ?> response =
        client
            .get()
            .uri(
                u -> {
                  u.path("/api/")
                      .queryParam("version", "2.1")
                      .queryParam("state", state)
                      .queryParam("enumeration_type", "NPI-1")
                      .queryParam("limit", 20);
                  u.queryParam("last_name", name.isBlank() ? "Smith" : name);
                  return u.build();
                })
            .retrieve()
            .body(Map.class);
    if (response != null && response.containsKey("Errors"))
      throw new IllegalArgumentException(
          "Provider registry rejected this search. Try a last name and state.");
    List<Map<String, Object>> mapped = new ArrayList<>();
    if (response != null && response.get("results") instanceof List<?> entries)
      for (Object item : entries) {
        Map<?, ?> r = (Map<?, ?>) item;
        Map<?, ?> b = (Map<?, ?>) r.get("basic");
        String specialty = "Healthcare Provider";
        if (r.get("taxonomies") instanceof List<?> ts && !ts.isEmpty())
          specialty = String.valueOf(((Map<?, ?>) ts.get(0)).get("desc"));
        mapped.add(
            Map.of(
                "id",
                String.valueOf(r.get("number")),
                "name",
                String.valueOf(b.get("first_name")) + " " + String.valueOf(b.get("last_name")),
                "specialty",
                specialty,
                "city",
                "Registry listing",
                "state",
                state));
      }
    return Map.of(
        "source",
        name.isBlank() ? "CMS NPPES API v2.1 · default last name: Smith" : "CMS NPPES API v2.1",
        "results",
        mapped);
  }
}
