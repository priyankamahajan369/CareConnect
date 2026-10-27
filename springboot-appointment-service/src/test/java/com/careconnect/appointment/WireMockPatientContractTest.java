package com.careconnect.appointment;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;

import com.github.tomakehurst.wiremock.WireMockServer;
import java.util.*;
import org.junit.jupiter.api.*;

class WireMockPatientContractTest {
  @Test
  void forwardsBearerAndMapsPatientContract() {
    var server = new WireMockServer(0);
    server.start();
    try {
      UUID id = UUID.randomUUID();
      server.stubFor(
          get(urlEqualTo("/api/v1/patients/" + id))
              .withHeader("Authorization", equalTo("Bearer test-token"))
              .willReturn(
                  okJson(
                      "{\"id\":\""
                          + id
                          + "\",\"name\":\"Maya\",\"email\":\"maya@example.test\",\"ownerSub\":\"patient-demo\"}")));
      var result =
          new RestPatientClient(
                  server.baseUrl(), org.springframework.web.client.RestClient.builder())
              .get(id, "test-token");
      assertEquals("patient-demo", result.ownerSub());
    } finally {
      server.stop();
    }
  }
}
