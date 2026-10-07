package com.fitplix.controller;

import com.fitplix.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping({"/api/account", "/api/v1/account"})
public class PrivacyController {
  private final JdbcTemplate db;
  private final UserRepository users;
  private final PasswordEncoder passwords;

  public PrivacyController(JdbcTemplate d, UserRepository u, PasswordEncoder p) {
    db = d;
    users = u;
    passwords = p;
  }

  public record Confirm(@NotBlank @Size(max = 200) String password) {}

  private UUID verify(Authentication a, Confirm c) {
    UUID id = (UUID) a.getPrincipal();
    if (!passwords.matches(c.password(), users.findById(id).orElseThrow().passwordHash))
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Password is incorrect");
    return id;
  }

  @PostMapping("/export")
  @Transactional(readOnly = true)
  public Object export(Authentication a, @Valid @RequestBody Confirm c) {
    UUID id = verify(a, c);
    Map<String, Object> out = new LinkedHashMap<>();
    out.put(
        "account", db.queryForMap("SELECT id,email,name,created_at FROM app_user WHERE id=?", id));
    for (String table :
        List.of(
            "user_profile",
            "meal",
            "water_entry",
            "weight_entry",
            "activity_entry",
            "daily_target",
            "saved_meal",
            "favorite_food",
            "workout_record",
            "analytics_event",
            "experiment_assignment"))
      out.put(table, db.queryForList("SELECT * FROM " + table + " WHERE user_id=?", id));
    out.put(
        "meal_item",
        db.queryForList(
            "SELECT i.* FROM meal_item i JOIN meal m ON m.id=i.meal_id WHERE m.user_id=?", id));
    out.put("custom_foods", db.queryForList("SELECT * FROM food WHERE owner_id=?", id));
    return out;
  }

  @DeleteMapping
  @Transactional
  public Object delete(Authentication a, @Valid @RequestBody Confirm c) {
    UUID id = verify(a, c);
    // Remove food references before owner-cascade; never delete shared source foods.
    db.update("DELETE FROM meal WHERE user_id=?", id);
    db.update("DELETE FROM favorite_food WHERE user_id=?", id);
    db.update("DELETE FROM visitor WHERE user_id=?", id);
    db.update("DELETE FROM app_user WHERE id=?", id);
    return Map.of(
        "message",
        "Account and associated active records deleted. Backup retention is described in the"
            + " privacy notice.");
  }
}
