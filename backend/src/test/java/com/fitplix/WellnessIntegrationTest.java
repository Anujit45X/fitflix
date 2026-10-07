package com.fitplix;

import static org.junit.jupiter.api.Assertions.*;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;

@EnabledIfEnvironmentVariable(named = "RUN_DB_TESTS", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WellnessIntegrationTest {
  @Autowired TestRestTemplate rest;
  @Autowired JdbcTemplate db;
  final String password = "Integration-password-2026!";

  record Account(String token, String id) {}

  Account account() {
    var r =
        rest.postForEntity(
            "/api/v1/auth/register",
            Map.of(
                "name",
                "Integration",
                "email",
                UUID.randomUUID() + "@example.invalid",
                "password",
                password),
            Map.class);
    assertEquals(200, r.getStatusCode().value());
    var user = (Map<?, ?>) r.getBody().get("user");
    var a = new Account((String) r.getBody().get("accessToken"), user.get("id").toString());
    assertEquals(
        200,
        call(
                a,
                "/profile",
                HttpMethod.PUT,
                Map.of(
                    "age",
                    25,
                    "sex",
                    "MALE",
                    "height",
                    170,
                    "weight",
                    70,
                    "targetWeight",
                    65,
                    "activity",
                    "MODERATE",
                    "goal",
                    "LOSE",
                    "diet",
                    "VEGETARIAN",
                    "waterTarget",
                    2500,
                    "timezone",
                    "Asia/Kolkata"))
            .getStatusCode()
            .value());
    return a;
  }

  ResponseEntity<Map> call(Account a, String path, HttpMethod method, Object body) {
    HttpHeaders h = new HttpHeaders();
    h.setBearerAuth(a.token);
    return rest.exchange("/api/v1" + path, method, new HttpEntity<>(body, h), Map.class);
  }

  HttpHeaders headers(Account a) {
    var h = new HttpHeaders();
    h.setBearerAuth(a.token);
    return h;
  }

  String date() {
    return LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
  }

  Map<String, Object> meal(double grams) {
    return Map.of(
        "date",
        date(),
        "mealType",
        "LUNCH",
        "items",
        List.of(Map.of("foodId", 168878, "grams", grams)));
  }

  @Test
  void mealsUseSnapshotsAndRejectCrossUserWrites() {
    var a = account();
    var b = account();
    var r = call(a, "/meals", HttpMethod.POST, meal(150));
    assertEquals(200, r.getStatusCode().value());
    String id = r.getBody().get("id").toString();
    assertEquals(
        195.0,
        ((Number) ((Map) ((List) r.getBody().get("items")).getFirst()).get("calories"))
            .doubleValue(),
        1e-6);
    assertEquals(404, call(b, "/meals/" + id, HttpMethod.PUT, meal(200)).getStatusCode().value());
    assertEquals(404, call(b, "/meals/" + id, HttpMethod.DELETE, null).getStatusCode().value());
    var edited = call(a, "/meals/" + id, HttpMethod.PUT, meal(200));
    assertEquals(200, edited.getStatusCode().value());
    assertEquals(
        260.0,
        ((Number) ((Map) ((List) edited.getBody().get("items")).getFirst()).get("calories"))
            .doubleValue(),
        1e-6);
    double old = db.queryForObject("SELECT calories FROM food WHERE id=168878", Double.class);
    try {
      db.update("UPDATE food SET calories=999 WHERE id=168878");
      var dash = call(a, "/dashboard?date=" + date(), HttpMethod.GET, null);
      assertEquals(
          260.0,
          ((Number) ((Map) dash.getBody().get("totals")).get("calories")).doubleValue(),
          1e-6);
    } finally {
      db.update("UPDATE food SET calories=? WHERE id=168878", old);
    }
    assertEquals(400, call(a, "/meals", HttpMethod.POST, meal(0)).getStatusCode().value());
    assertEquals(200, call(a, "/meals/" + id, HttpMethod.DELETE, null).getStatusCode().value());
  }

  @Test
  void savedMealsWaterWorkoutsAndPrivacyRespectOwnership() {
    var a = account();
    var b = account();
    var saved =
        call(
            a,
            "/saved-meals",
            HttpMethod.POST,
            Map.of(
                "name",
                "Test thali",
                "mealType",
                "LUNCH",
                "items",
                List.of(Map.of("foodId", 172421, "grams", 150))));
    String sid = saved.getBody().get("id").toString();
    assertEquals(
        404,
        call(b, "/saved-meals/" + sid + "/log", HttpMethod.POST, Map.of("date", date()))
            .getStatusCode()
            .value());
    assertEquals(
        200,
        call(a, "/saved-meals/" + sid + "/log", HttpMethod.POST, Map.of("date", date()))
            .getStatusCode()
            .value());
    var water = call(a, "/water", HttpMethod.POST, Map.of("date", date(), "ml", 250));
    String wid = water.getBody().get("id").toString();
    assertEquals(404, call(b, "/water/" + wid, HttpMethod.DELETE, null).getStatusCode().value());
    assertEquals(200, call(a, "/water/" + wid, HttpMethod.DELETE, null).getStatusCode().value());
    assertEquals(
        200,
        call(a, "/weight", HttpMethod.POST, Map.of("date", date(), "kg", 69.5))
            .getStatusCode()
            .value());
    var schedule = Map.of("templateId", "home-beginner", "date", date());
    assertEquals(200, call(a, "/workouts", HttpMethod.POST, schedule).getStatusCode().value());
    assertEquals(200, call(a, "/workouts", HttpMethod.POST, schedule).getStatusCode().value());
    var rows =
        rest.exchange(
                "/api/v1/workouts?from=" + date() + "&to=" + date(),
                HttpMethod.GET,
                new HttpEntity<>(headers(a)),
                List.class)
            .getBody();
    assertEquals(1, rows.size());
    String id = ((Map) rows.getFirst()).get("id").toString();
    assertEquals(
        404,
        call(b, "/workouts/" + id, HttpMethod.PUT, Map.of("completed", true))
            .getStatusCode()
            .value());
    assertEquals(404, call(b, "/workouts/" + id, HttpMethod.DELETE, null).getStatusCode().value());
    assertEquals(
        200,
        call(a, "/workouts/" + id, HttpMethod.PUT, Map.of("completed", true))
            .getStatusCode()
            .value());
    String future = LocalDate.parse(date()).plusDays(1).toString();
    call(a, "/workouts", HttpMethod.POST, Map.of("templateId", "home-beginner", "date", future));
    UUID futureId =
        db.queryForObject(
            "SELECT id FROM workout_record WHERE user_id=? AND date=?",
            UUID.class,
            UUID.fromString(a.id),
            LocalDate.parse(future));
    assertEquals(
        400,
        call(a, "/workouts/" + futureId, HttpMethod.PUT, Map.of("completed", true))
            .getStatusCode()
            .value());
    assertEquals(
        403,
        call(a, "/account/export", HttpMethod.POST, Map.of("password", "wrong"))
            .getStatusCode()
            .value());
    var export = call(a, "/account/export", HttpMethod.POST, Map.of("password", password));
    assertEquals(200, export.getStatusCode().value());
    assertFalse(export.getBody().toString().contains("password_hash"));
    assertTrue(export.getBody().containsKey("workout_record"));
    assertEquals(
        200,
        call(a, "/account", HttpMethod.DELETE, Map.of("password", password))
            .getStatusCode()
            .value());
    assertEquals(401, call(a, "/me", HttpMethod.GET, null).getStatusCode().value());
    assertEquals(
        0,
        db.queryForObject(
            "SELECT count(*) FROM workout_record WHERE user_id=?",
            Integer.class,
            UUID.fromString(a.id)));
  }

  @Test
  void catalogAndTimezoneAreSourceBackedAndValidated() {
    var a = account();
    assertEquals(
        7793,
        db.queryForObject("SELECT count(*) FROM food WHERE source_id IS NOT NULL", Integer.class));
    assertEquals(4, db.queryForObject("SELECT count(*) FROM recipe", Integer.class));
    var servings =
        rest.exchange(
                "/api/v1/foods/168878/servings",
                HttpMethod.GET,
                new HttpEntity<>(headers(a)),
                List.class)
            .getBody();
    assertEquals(150.0, ((Number) ((Map) servings.getFirst()).get("grams")).doubleValue(), 1e-6);
    assertEquals(6, db.queryForObject("SELECT count(*) FROM workout_template", Integer.class));
    assertEquals(
        400,
        call(
                a,
                "/profile",
                HttpMethod.PUT,
                Map.of(
                    "age",
                    25,
                    "sex",
                    "MALE",
                    "height",
                    170,
                    "weight",
                    70,
                    "targetWeight",
                    65,
                    "activity",
                    "MODERATE",
                    "goal",
                    "LOSE",
                    "diet",
                    "VEGETARIAN",
                    "waterTarget",
                    2500,
                    "timezone",
                    "Mars/Base"))
            .getStatusCode()
            .value());
    assertEquals(
        400,
        call(
                a,
                "/water",
                HttpMethod.POST,
                Map.of("date", LocalDate.parse(date()).plusDays(1).toString(), "ml", 250))
            .getStatusCode()
            .value());
    assertEquals(
        401, rest.getForEntity("/api/v1/workouts/templates", String.class).getStatusCode().value());
  }
}
