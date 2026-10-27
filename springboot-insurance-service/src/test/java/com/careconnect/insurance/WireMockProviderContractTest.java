package com.careconnect.insurance;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;

import com.github.tomakehurst.wiremock.WireMockServer;
import java.util.*;
import org.junit.jupiter.api.Test;

class WireMockProviderContractTest {
  @Test
  void mapsRegistryAndUsesExplicitDefaultSearch() {
    var server = new WireMockServer(0);
    server.start();
    try {
      server.stubFor(
          get(urlPathEqualTo("/api/"))
              .withQueryParam("version", equalTo("2.1"))
              .withQueryParam("last_name", equalTo("Smith"))
              .withQueryParam("state", equalTo("NY"))
              .willReturn(
                  okJson(
                      "{\"result_count\":1,\"results\":[{\"number\":\"1234567890\",\"basic\":{\"first_name\":\"Synthetic\",\"last_name\":\"Smith\"},\"taxonomies\":[{\"desc\":\"Family"
                          + " Medicine\"}]}]}")));
      var result = new RestProviderClient(server.baseUrl(), "live").search("NY", "");
      assertTrue(result.get("source").toString().contains("Smith"));
      assertEquals(1, ((List<?>) result.get("results")).size());
    } finally {
      server.stop();
    }
  }

  @Test
  void rejectsRegistryErrorInsteadOfFabricatingResults() {
    var server = new WireMockServer(0);
    server.start();
    try {
      server.stubFor(
          get(urlPathEqualTo("/api/"))
              .willReturn(okJson("{\"Errors\":[{\"description\":\"Invalid search\"}]}")));
      assertThrows(
          IllegalArgumentException.class,
          () -> new RestProviderClient(server.baseUrl(), "live").search("NY", "x"));
    } finally {
      server.stop();
    }
  }
}
