package com.fitplix.service;

import com.fitplix.dto.AuthDtos.*;
import com.fitplix.entity.*;
import com.fitplix.repository.*;
import com.fitplix.security.TokenService;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final UserRepository users;
  private final SessionRepository sessions;
  private final PasswordEncoder passwords;
  private final TokenService tokens;
  private final EventService events;
  private final String dummy;

  public record Result(String accessToken, String refreshToken, Map<String, Object> user) {}

  public AuthService(
      UserRepository u, SessionRepository s, PasswordEncoder p, TokenService t, EventService e) {
    users = u;
    sessions = s;
    passwords = p;
    tokens = t;
    events = e;
    dummy = p.encode(UUID.randomUUID().toString());
  }

  public Map<String, Object> view(AppUser u) {
    return Map.of("id", u.id, "name", u.name, "email", u.email, "role", u.role, "demo", u.demo);
  }

  @Transactional
  public Result register(Register d) {
    if (d.password().getBytes(StandardCharsets.UTF_8).length > 72)
      throw new IllegalArgumentException("Password must be at most 72 UTF-8 bytes");
    String email = d.email().trim().toLowerCase(Locale.ROOT);
    if (users.findByEmail(email).isPresent())
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    AppUser u = new AppUser();
    u.name = d.name().trim();
    u.email = email;
    u.passwordHash = passwords.encode(d.password());
    users.saveAndFlush(u);
    events.record(u.id, "USER_REGISTERED");
    return create(u);
  }

  @Transactional
  public Result login(Login d) {
    var candidate = users.findForLogin(d.email().trim().toLowerCase(Locale.ROOT));
    boolean match =
        passwords.matches(d.password(), candidate.map(u -> u.passwordHash).orElse(dummy));
    if (candidate.isEmpty() || !match)
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
    AppUser u = candidate.get();
    events.record(u.id, "USER_LOGIN");
    return create(u);
  }

  private Result create(AppUser u) {
    AuthSession s = new AuthSession();
    s.userId = u.id;
    s.expiresAt = Instant.now().plusSeconds(30L * 86400);
    return rotate(u, s);
  }

  private Result rotate(AppUser u, AuthSession s) {
    byte[] bytes = new byte[48];
    new SecureRandom().nextBytes(bytes);
    String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    s.refreshHash = hash(raw);
    sessions.save(s);
    return new Result(tokens.issue(u.id, s.id), raw, view(u));
  }

  @Transactional
  public Result refresh(String raw) {
    AuthSession s =
        sessions
            .findByRefreshHash(hash(raw))
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired"));
    if (s.revoked || s.expiresAt.isBefore(Instant.now()))
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired");
    return rotate(users.findById(s.userId).orElseThrow(), s);
  }

  @Transactional
  public void logout(String raw) {
    sessions
        .findByRefreshHash(hash(raw))
        .ifPresent(
            s -> {
              s.revoked = true;
              sessions.save(s);
            });
  }

  public static String hash(String raw) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
