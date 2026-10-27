package com.careconnect.patient;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.careconnect.common.RestExceptionHandler;
import com.careconnect.common.SpringSecurityConfig;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RestPatientController.class)
@Import({SpringSecurityConfig.class, SpringPatientAccess.class, RestExceptionHandler.class})
class SpringSecurityPatientTest {
  @Autowired MockMvc mvc;
  @MockitoBean JpaPatientRepository repo;
  @MockitoBean JwtDecoder decoder;

  @Test
  void rejectsAnonymousPatientDirectoryRead() throws Exception {
    mvc.perform(get("/api/v1/patients")).andExpect(status().isUnauthorized());
  }

  @Test
  void patientCannotReadAnotherPatientsRecord() throws Exception {
    UUID id = UUID.randomUUID();
    var p = new JpaPatientEntity();
    p.id = id;
    p.ownerSub = "another-owner";
    when(repo.findById(id)).thenReturn(Optional.of(p));
    mvc.perform(
            get("/api/v1/patients/" + id)
                .with(
                    jwt()
                        .jwt(j -> j.subject("owner"))
                        .authorities(new SimpleGrantedAuthority("ROLE_PATIENT"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void patientCanReadOwnRecord() throws Exception {
    UUID id = UUID.randomUUID();
    var p = new JpaPatientEntity();
    p.id = id;
    p.name = "Synthetic Maya";
    p.ownerSub = "owner";
    when(repo.findById(id)).thenReturn(Optional.of(p));
    mvc.perform(
            get("/api/v1/patients/" + id)
                .with(
                    jwt()
                        .jwt(j -> j.subject("owner"))
                        .authorities(new SimpleGrantedAuthority("ROLE_PATIENT"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Synthetic Maya"));
  }
}
