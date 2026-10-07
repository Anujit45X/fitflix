package com.fitplix.service;

import com.fitplix.repository.WellnessRepository;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WellnessService {
  private final WellnessRepository repo;
  private final NutritionService nutrition;
  private final FoodService foods;

  public WellnessService(WellnessRepository r, NutritionService n, FoodService f) {
    repo = r;
    nutrition = n;
    foods = f;
  }

  public Object servings(UUID u, long food) {
    foods.accessible(food, u);
    return repo.servings(food);
  }

  public Object recipes() {
    return repo.recipes();
  }

  public Object templates() {
    return repo.templates();
  }

  public Object records(UUID u, LocalDate from, LocalDate to) {
    if (to.isBefore(from)
        || from.isBefore(nutrition.today(u).minusDays(365))
        || to.isAfter(nutrition.today(u).plusDays(90)))
      throw new IllegalArgumentException("Choose a range within the past year and next 90 days");
    return repo.records(u, from, to);
  }

  @Transactional
  public void schedule(UUID u, String template, LocalDate date) {
    if (date.isBefore(nutrition.today(u).minusDays(365))
        || date.isAfter(nutrition.today(u).plusDays(90)))
      throw new IllegalArgumentException("Choose a date within the past year and next 90 days");
    if (!repo.templateExists(template))
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout not found");
    repo.schedule(UUID.randomUUID(), u, template, date);
  }

  @Transactional
  public void complete(UUID u, UUID id, boolean complete) {
    var date =
        repo.ownedDate(id, u)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout not found"));
    if (complete && date.isAfter(nutrition.today(u)))
      throw new IllegalArgumentException("Future workouts cannot be completed");
    repo.complete(id, u, complete);
  }

  @Transactional
  public void delete(UUID u, UUID id) {
    if (repo.delete(id, u) == 0)
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout not found");
  }
}
