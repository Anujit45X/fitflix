package com.fitplix;

import static org.junit.jupiter.api.Assertions.*;

import com.fitplix.security.TokenService;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TokenServiceTest {
  @Test
  void signedClaimsRoundTripAndTamperingFails() {
    TokenService tokens = new TokenService("unit-test-secret-with-at-least-32-bytes");
    UUID user = UUID.randomUUID(), session = UUID.randomUUID();
    String token = tokens.issue(user, session);
    assertEquals(user.toString(), tokens.verify(token).getSubject());
    String[] parts = token.split("\\.");
    String bad =
        parts[0]
            + "."
            + parts[1]
            + "."
            + (parts[2].startsWith("A") ? "B" : "A")
            + parts[2].substring(1);
    assertThrows(IllegalArgumentException.class, () -> tokens.verify(bad));
  }

  @Test
  void shortSecretsAreRejected() {
    assertThrows(IllegalStateException.class, () -> new TokenService("short"));
  }
}
