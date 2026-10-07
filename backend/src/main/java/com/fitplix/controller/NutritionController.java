package com.fitplix.controller;

import com.fitplix.dto.NutritionDtos.*;
import com.fitplix.service.*;
import jakarta.validation.Valid;
import java.time.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api", "/api/v1"})
public class NutritionController {
  private final NutritionService nutrition;
  private final FoodService foods;
  private final EventService events;

  public NutritionController(NutritionService n, FoodService f, EventService e) {
    nutrition = n;
    foods = f;
    events = e;
  }

  private UUID user(Authentication a) {
    return (UUID) a.getPrincipal();
  }

  @GetMapping({"/foods", "/foods/search"})
  public Object foods(
      Authentication a,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String category,
      @RequestParam(defaultValue = "name") String sort,
      @RequestParam(defaultValue = "0") int page) {
    return foods.search(user(a), search, category, sort, page);
  }

  @GetMapping("/foods/categories")
  public Object categories(Authentication a) {
    return foods.categories(user(a));
  }

  @PostMapping("/foods")
  public Object custom(Authentication a, @Valid @RequestBody CustomFood d) {
    return foods.custom(user(a), d);
  }

  @GetMapping("/favorites")
  public Object favorites(Authentication a) {
    return foods.favorites(user(a));
  }

  @PostMapping("/favorites")
  public Object favorite(Authentication a, @Valid @RequestBody Favorite d) {
    foods.toggle(user(a), d.foodId());
    return Map.of("ok", true);
  }

  @GetMapping("/meals")
  public Object meals(Authentication a, @RequestParam LocalDate date) {
    nutrition.date(user(a), date);
    return nutrition.meals(user(a), date);
  }

  @PostMapping("/meals")
  public Object log(Authentication a, @Valid @RequestBody MealRequest d) {
    return nutrition.log(user(a), d);
  }

  @PutMapping("/meals/{id}")
  public Object edit(Authentication a, @PathVariable UUID id, @Valid @RequestBody MealRequest d) {
    return nutrition.edit(user(a), id, d);
  }

  @DeleteMapping("/meals/{id}")
  public Object delete(Authentication a, @PathVariable UUID id) {
    nutrition.delete(user(a), id);
    return Map.of("ok", true);
  }

  @PostMapping("/meals/copy")
  public Object copy(Authentication a, @Valid @RequestBody Copy d) {
    return Map.of("copied", nutrition.copy(user(a), d.date()));
  }

  @PostMapping("/water")
  public Object water(Authentication a, @Valid @RequestBody Water d) {
    return nutrition.water(user(a), d);
  }

  @DeleteMapping("/water/{id}")
  public Object deleteWater(Authentication a, @PathVariable UUID id) {
    nutrition.deleteWater(user(a), id);
    return Map.of("ok", true);
  }

  @PostMapping("/weight")
  public Object weight(Authentication a, @Valid @RequestBody Weight d) {
    return nutrition.weight(user(a), d);
  }

  @PostMapping("/activity")
  public Object activity(Authentication a, @Valid @RequestBody Activity d) {
    return nutrition.activity(user(a), d);
  }

  @PutMapping("/goals")
  public Object goals(Authentication a, @Valid @RequestBody Targets d) {
    return nutrition.goals(user(a), d);
  }

  @GetMapping("/dashboard")
  public Object dashboard(Authentication a, @RequestParam(required = false) LocalDate date) {
    return nutrition.dashboard(user(a), date == null ? nutrition.today(user(a)) : date);
  }

  @GetMapping("/saved-meals")
  public Object saved(Authentication a) {
    return nutrition.saved(user(a));
  }

  @PostMapping("/saved-meals")
  public Object save(Authentication a, @Valid @RequestBody Saved d) {
    return nutrition.save(user(a), d);
  }

  @PostMapping("/saved-meals/{id}/log")
  public Object logSaved(Authentication a, @PathVariable UUID id, @Valid @RequestBody Copy d) {
    return nutrition.logSaved(user(a), id, d.date());
  }

  @DeleteMapping("/saved-meals/{id}")
  public Object deleteSaved(Authentication a, @PathVariable UUID id) {
    nutrition.deleteSaved(user(a), id);
    return Map.of("ok", true);
  }

  @PostMapping("/events/{event}")
  public Object event(Authentication a, @PathVariable String event) {
    if (!Set.of("FOOD_SEARCHED", "ANALYTICS_VIEWED").contains(event))
      throw new IllegalArgumentException("Unknown client event");
    events.record(user(a), event);
    return Map.of("ok", true);
  }
}
