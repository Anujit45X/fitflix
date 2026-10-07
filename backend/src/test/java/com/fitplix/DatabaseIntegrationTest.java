package com.fitplix;

import static org.junit.jupiter.api.Assertions.*;

import com.fitplix.repository.UserRepository;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

@EnabledIfEnvironmentVariable(named = "RUN_DB_TESTS", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DatabaseIntegrationTest {
  @Autowired TestRestTemplate rest;
  @Autowired UserRepository users;
  @Autowired org.springframework.jdbc.core.JdbcTemplate db;

  @Test
  void realHttpRegistrationPersistsHashedAccountAndProtectsRecords() {
    String email = "junit-" + UUID.randomUUID() + "@example.com";
    var input =
        Map.of(
            "name", "Integration Test", "email", email, "password", "Integration-passphrase-2026");
    assertEquals(401, rest.getForEntity("/api/me", String.class).getStatusCode().value());
    var register = rest.postForEntity("/api/auth/register", input, Map.class);
    assertEquals(200, register.getStatusCode().value());
    var stored = users.findByEmail(email).orElseThrow();
    assertTrue(stored.passwordHash.startsWith("$2"));
    assertNotEquals(input.get("password"), stored.passwordHash);
    assertEquals("USER", stored.role);
    HttpHeaders h = new HttpHeaders();
    h.setBearerAuth((String) register.getBody().get("accessToken"));
    var me = rest.exchange("/api/me", HttpMethod.GET, new HttpEntity<>(h), Map.class);
    assertEquals(200, me.getStatusCode().value());
    assertNull(me.getBody().get("profile"));
    assertEquals(
        403,
        rest.exchange(
                "/api/admin/product-metrics", HttpMethod.GET, new HttpEntity<>(h), String.class)
            .getStatusCode()
            .value());
    assertEquals(
        409, rest.postForEntity("/api/auth/register", input, Map.class).getStatusCode().value());
  }

  @Test
  void expiredResetIsRejectedAndValidResetRevokesSessions() {
    String email = "reset-junit-" + UUID.randomUUID() + "@example.invalid";
    var response =
        rest.postForEntity(
            "/api/auth/register",
            Map.of("name", "Reset test", "email", email, "password", "Original-password-123"),
            Map.class);
    assertEquals(200, response.getStatusCode().value());
    UUID id = users.findByEmail(email).orElseThrow().id;
    String raw = "A".repeat(64), hash = com.fitplix.service.AuthService.hash(raw);
    db.update("DELETE FROM password_reset WHERE token_hash=?", hash);
    db.update(
        "INSERT INTO password_reset(token_hash,user_id,created_at,expires_at) VALUES"
            + " (?,?,now()-interval '2 hours',now()-interval '1 hour')",
        hash,
        id);
    var input = Map.of("token", raw, "password", "Replacement-password-123");
    assertEquals(
        400,
        rest.postForEntity("/api/auth/reset-password", input, Map.class).getStatusCode().value());
    db.update(
        "UPDATE password_reset SET expires_at=now()+interval '15 minutes' WHERE token_hash=?",
        hash);
    assertEquals(
        200,
        rest.postForEntity("/api/auth/reset-password", input, Map.class).getStatusCode().value());
    assertEquals(
        400,
        rest.postForEntity("/api/auth/reset-password", input, Map.class).getStatusCode().value());
    assertEquals(
        0L,
        db.queryForObject(
            "SELECT count(*) FROM auth_session WHERE user_id=? AND revoked=false", Long.class, id));
    assertTrue(users.findByEmail(email).orElseThrow().passwordHash.startsWith("$2"));
    db.update("DELETE FROM app_user WHERE id=?", id);
  }

  @Test
  void disabledRecoveryIsExplicitAndAccountNeutral() {
    if (!Boolean.parseBoolean(System.getenv().getOrDefault("MAIL_ENABLED", "false"))) {
      var first =
          rest.postForEntity(
              "/api/auth/forgot-password", Map.of("email", "missing@example.invalid"), Map.class);
      var second =
          rest.postForEntity(
              "/api/auth/forgot-password", Map.of("email", "admin@fitplix.local"), Map.class);
      assertEquals(503, first.getStatusCode().value());
      assertEquals(first.getStatusCode(), second.getStatusCode());
      assertEquals(first.getBody().get("message"), second.getBody().get("message"));
    }
  }
}
