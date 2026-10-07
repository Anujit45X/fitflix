package com.fitplix.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
  private final byte[] secret;

  public TokenService(@Value("${fitplix.jwt-secret}") String s) {
    secret = s.getBytes(StandardCharsets.UTF_8);
    if (secret.length < 32)
      throw new IllegalStateException("JWT_SECRET must have at least 32 bytes");
  }

  public String issue(UUID user, UUID session) {
    try {
      Instant now = Instant.now();
      SignedJWT jwt =
          new SignedJWT(
              new JWSHeader(JWSAlgorithm.HS256),
              new JWTClaimsSet.Builder()
                  .issuer("fitplix")
                  .audience("fitplix-web")
                  .subject(user.toString())
                  .claim("sid", session.toString())
                  .issueTime(Date.from(now))
                  .expirationTime(Date.from(now.plusSeconds(900)))
                  .build());
      jwt.sign(new MACSigner(secret));
      return jwt.serialize();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public JWTClaimsSet verify(String token) {
    try {
      SignedJWT j = SignedJWT.parse(token);
      if (!j.getHeader().getAlgorithm().equals(JWSAlgorithm.HS256)
          || !j.verify(new MACVerifier(secret))) throw new Exception();
      JWTClaimsSet c = j.getJWTClaimsSet();
      if (!"fitplix".equals(c.getIssuer())
          || !c.getAudience().contains("fitplix-web")
          || c.getExpirationTime().before(new Date())) throw new Exception();
      return c;
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid access token");
    }
  }
}
