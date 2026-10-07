package com.fitplix.service;

import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecoveryService {
  private final JdbcTemplate db;
  private final TransactionTemplate tx;
  private final JavaMailSender mail;
  private final PasswordEncoder passwords;
  private final boolean enabled;
  private final String origin, from;
  private final ThreadPoolExecutor worker =
      new ThreadPoolExecutor(
          1,
          1,
          0,
          TimeUnit.SECONDS,
          new ArrayBlockingQueue<>(100),
          new ThreadPoolExecutor.AbortPolicy());
  private static final org.slf4j.Logger log =
      org.slf4j.LoggerFactory.getLogger(RecoveryService.class);

  public RecoveryService(
      JdbcTemplate db,
      org.springframework.transaction.PlatformTransactionManager manager,
      JavaMailSender mail,
      PasswordEncoder passwords,
      @Value("${fitplix.mail-enabled}") boolean enabled,
      @Value("${fitplix.allowed-origin}") String origin,
      @Value("${fitplix.mail-from}") String from) {
    this.db = db;
    this.tx = new TransactionTemplate(manager);
    this.mail = mail;
    this.passwords = passwords;
    this.enabled = enabled;
    this.origin = origin;
    this.from = from;
  }

  public void request(String email) {
    if (!enabled)
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Password recovery is temporarily unavailable. Contact the application operator.");
    try {
      // Queue both known and unknown addresses: response does not wait for lookup or SMTP.
      worker.execute(
          () -> {
            try {
              tx.executeWithoutResult(status -> deliver(email.trim().toLowerCase(Locale.ROOT)));
            } catch (RuntimeException e) {
              log.error("Password recovery delivery failed; check SMTP and database health");
            }
          });
    } catch (RejectedExecutionException e) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Please try again later");
    }
  }

  private void deliver(String email) {
    var ids =
        db.queryForList("SELECT id FROM app_user WHERE email=? FOR UPDATE", UUID.class, email);
    if (ids.isEmpty()) return;
    UUID id = ids.get(0);
    // Per-account cooldown is shared by API instances and serialized by the user lock.
    if (db.queryForObject(
            "SELECT count(*) FROM password_reset WHERE user_id=? AND created_at > now()-interval '1"
                + " minute'",
            Long.class,
            id)
        > 0) return;
    byte[] bytes = new byte[48];
    new SecureRandom().nextBytes(bytes);
    String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    db.update("DELETE FROM password_reset WHERE user_id=?", id);
    db.update(
        "INSERT INTO password_reset(token_hash,user_id,expires_at) VALUES (?,?,now()+interval '15"
            + " minutes')",
        AuthService.hash(raw),
        id);
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(email);
    message.setSubject("Reset your Fitplix password");
    message.setText(
        "Use this link within 15 minutes to choose a new password:\n\n"
            + origin
            + "/reset-password#token="
            + raw
            + "\n\nThis link can be used once. If you did not request it, ignore this email.");
    mail.send(
        message); // Failure rolls back issuance. Tokens are never logged or stored in plaintext.
  }

  public void reset(String raw, String password) {
    if (password.length() < 12
        || password.length() > 72
        || password.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new IllegalArgumentException(
          "Password must be 12–72 characters and at most 72 UTF-8 bytes");
    String hash = AuthService.hash(raw);
    tx.executeWithoutResult(
        status -> {
          var ids =
              db.queryForList(
                  "SELECT user_id FROM password_reset WHERE token_hash=?", UUID.class, hash);
          if (ids.isEmpty()) throw invalid();
          UUID id = ids.get(0);
          db.queryForList("SELECT id FROM app_user WHERE id=? FOR UPDATE", UUID.class, id);
          int used =
              db.update(
                  "UPDATE password_reset SET used_at=now() WHERE token_hash=? AND used_at IS NULL"
                      + " AND expires_at>now()",
                  hash);
          if (used != 1) throw invalid();
          db.update(
              "UPDATE app_user SET password_hash=? WHERE id=?", passwords.encode(password), id);
          db.update("UPDATE auth_session SET revoked=true WHERE user_id=?", id);
          db.update(
              "UPDATE password_reset SET used_at=now() WHERE user_id=? AND used_at IS NULL", id);
        });
  }

  private ResponseStatusException invalid() {
    return new ResponseStatusException(
        HttpStatus.BAD_REQUEST, "This reset link is invalid or expired. Request a new link.");
  }

  @PreDestroy
  public void stop() {
    worker.shutdownNow();
  }
}
