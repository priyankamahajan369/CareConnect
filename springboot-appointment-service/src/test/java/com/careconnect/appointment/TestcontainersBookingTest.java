package com.careconnect.appointment;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.*;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;

@Testcontainers(disabledWithoutDocker = true)
class TestcontainersBookingTest {
  @Container static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:17.6-alpine");

  @Test
  void databaseConstraintGuardsConcurrentBooking() throws Exception {
    Flyway.configure()
        .dataSource(db.getJdbcUrl(), db.getUsername(), db.getPassword())
        .load()
        .migrate();
    try (var c = DriverManager.getConnection(db.getJdbcUrl(), db.getUsername(), db.getPassword())) {
      String sql =
          "insert into"
              + " appointments(id,patient_id,patient_name,patient_email,owner_sub,provider_id,provider_name,specialty,starts_at,status,visit_type,idempotency_key,request_hash,created_at)"
              + " values (?,?,'Maya','m@example.test','owner','doctor','Dr"
              + " Demo','Family','2099-01-01 10:00:00+00','CONFIRMED','Video"
              + " visit',?,'hash',now())";
      try (var first = c.prepareStatement(sql)) {
        first.setObject(1, UUID.randomUUID());
        first.setObject(2, UUID.randomUUID());
        first.setString(3, "first-key");
        first.executeUpdate();
      }
      try (var second = c.prepareStatement(sql)) {
        second.setObject(1, UUID.randomUUID());
        second.setObject(2, UUID.randomUUID());
        second.setString(3, "second-key");
        var e = assertThrows(SQLException.class, second::executeUpdate);
        assertEquals("23505", e.getSQLState());
      }
    }
  }
}
