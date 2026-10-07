package com.fitplix.repository;

import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class WellnessRepository {
  private final JdbcTemplate db;

  public WellnessRepository(JdbcTemplate db) {
    this.db = db;
  }

  public List<Map<String, Object>> servings(long foodId) {
    return db.queryForList(
        "SELECT label,grams,basis FROM food_serving WHERE food_id=? ORDER BY id", foodId);
  }

  public List<Map<String, Object>> recipes() {
    var rows = db.queryForList("SELECT * FROM recipe ORDER BY name");
    for (var row : rows)
      row.put(
          "items",
          db.queryForList(
              """
              SELECT f.id AS "foodId",f.name,f.calories,f.protein,f.carbs,f.fat,f.source,
              i.grams,i.role FROM recipe_ingredient i JOIN food f ON f.id=i.food_id
              WHERE i.recipe_id=? ORDER BY i.role,f.name
              """,
              row.get("id")));
    return rows;
  }

  public List<Map<String, Object>> templates() {
    var rows = db.queryForList("SELECT * FROM workout_template ORDER BY equipment,minutes");
    for (var row : rows)
      row.put(
          "exercises",
          db.queryForList(
              """
              SELECT e.*,w.sets,w.reps,w.rest_seconds AS "restSeconds" FROM workout_exercise w
              JOIN exercise e ON e.id=w.exercise_id WHERE w.template_id=? ORDER BY w.position
              """,
              row.get("id")));
    return rows;
  }

  public List<Map<String, Object>> records(UUID u, LocalDate from, LocalDate to) {
    return db.queryForList(
        """
        SELECT r.id,r.template_id AS "templateId",r.date,r.completed_at AS "completedAt",t.name,t.minutes
        FROM workout_record r JOIN workout_template t ON t.id=r.template_id
        WHERE r.user_id=? AND r.date BETWEEN ? AND ? ORDER BY r.date,r.created_at
        """,
        u,
        from,
        to);
  }

  public boolean templateExists(String id) {
    return Boolean.TRUE.equals(
        db.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM workout_template WHERE id=?)", Boolean.class, id));
  }

  public void schedule(UUID id, UUID u, String template, LocalDate date) {
    db.update(
        "INSERT INTO workout_record(id,user_id,template_id,date) VALUES(?,?,?,?) ON"
            + " CONFLICT(user_id,template_id,date) DO NOTHING",
        id,
        u,
        template,
        date);
  }

  public Optional<LocalDate> ownedDate(UUID id, UUID u) {
    return db
        .query(
            "SELECT date FROM workout_record WHERE id=? AND user_id=?",
            (rs, n) -> rs.getDate(1).toLocalDate(),
            id,
            u)
        .stream()
        .findFirst();
  }

  public void complete(UUID id, UUID u, boolean completed) {
    db.update(
        "UPDATE workout_record SET completed_at=CASE WHEN ? THEN coalesce(completed_at,now()) ELSE"
            + " NULL END WHERE id=? AND user_id=?",
        completed,
        id,
        u);
  }

  public int delete(UUID id, UUID u) {
    return db.update("DELETE FROM workout_record WHERE id=? AND user_id=?", id, u);
  }
}
