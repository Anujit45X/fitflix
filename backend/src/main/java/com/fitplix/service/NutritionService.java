package com.fitplix.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitplix.dto.NutritionDtos.*;
import com.fitplix.entity.*;
import com.fitplix.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NutritionService {
  private final MealRepository meals;
  private final WaterEntryRepository waters;
  private final WeightEntryRepository weights;
  private final ActivityEntryRepository activities;
  private final DailyTargetRepository targets;
  private final SavedMealRepository saved;
  private final ProfileRepository profiles;
  private final ProfileService profileService;
  private final FoodService foods;
  private final EventService events;
  private final ObjectMapper mapper;

  public NutritionService(
      MealRepository m,
      WaterEntryRepository w,
      WeightEntryRepository kg,
      ActivityEntryRepository a,
      DailyTargetRepository t,
      SavedMealRepository s,
      ProfileRepository p,
      ProfileService ps,
      FoodService f,
      EventService e,
      ObjectMapper om) {
    meals = m;
    waters = w;
    weights = kg;
    activities = a;
    targets = t;
    saved = s;
    profiles = p;
    profileService = ps;
    foods = f;
    events = e;
    mapper = om;
  }

  public LocalDate today(UUID u) {
    return LocalDate.now(ZoneId.of(profileService.require(u).timezone));
  }

  public void date(UUID u, LocalDate d) {
    LocalDate now = today(u);
    if (d.isAfter(now) || d.isBefore(now.minusDays(365)))
      throw new IllegalArgumentException("Choose a date within the past 365 days");
  }

  public DailyTarget target(UUID u, LocalDate d) {
    return targets
        .findByUserIdAndDate(u, d)
        .orElseGet(
            () -> {
              var p = profileService.require(u);
              DailyTarget t = new DailyTarget();
              t.userId = u;
              t.date = d;
              t.calories = p.calorieTarget;
              t.protein = p.proteinTarget;
              t.carbs = p.carbsTarget;
              t.fat = p.fatTarget;
              t.fiber = p.fiberTarget;
              t.water = p.waterTarget;
              return t;
            });
  }

  private void snapshot(UUID u, LocalDate d) {
    if (targets.findByUserIdAndDate(u, d).isEmpty()) targets.saveAndFlush(target(u, d));
  }

  public MealItem item(UUID u, Item d) {
    Food f = foods.accessible(d.foodId(), u);
    double n = d.grams() / 100;
    MealItem i = new MealItem();
    i.foodId = f.id;
    i.name = f.name;
    i.grams = d.grams();
    i.calories = f.calories * n;
    i.protein = f.protein * n;
    i.carbs = f.carbs * n;
    i.fat = f.fat * n;
    i.fiber = f.fiber == null ? 0 : f.fiber * n;
    i.sugar = f.sugar == null ? 0 : f.sugar * n;
    i.sodium = f.sodium == null ? 0 : f.sodium * n;
    i.incomplete = f.fiber == null || f.sugar == null || f.sodium == null;
    return i;
  }

  @Transactional
  public Meal log(UUID u, MealRequest d) {
    date(u, d.date());
    snapshot(u, d.date());
    Meal m = new Meal();
    m.userId = u;
    m.date = d.date();
    m.mealType = d.mealType();
    d.items().forEach(i -> m.items.add(item(u, i)));
    meals.save(m);
    events.record(u, "MEAL_LOGGED");
    return m;
  }

  @Transactional
  public Meal edit(UUID u, UUID id, MealRequest d) {
    date(u, d.date());
    Meal m = owned(u, id);
    snapshot(u, d.date());
    m.date = d.date();
    m.mealType = d.mealType();
    m.items.clear();
    d.items().forEach(i -> m.items.add(item(u, i)));
    return meals.save(m);
  }

  public Meal owned(UUID u, UUID id) {
    return meals
        .findByIdAndUserId(id, u)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meal not found"));
  }

  @Transactional
  public void delete(UUID u, UUID id) {
    meals.delete(owned(u, id));
  }

  public List<Meal> meals(UUID u, LocalDate d) {
    return meals.findByUserIdAndDateBetweenOrderByDateAsc(u, d, d);
  }

  @Transactional
  public int copy(UUID u, LocalDate date) {
    date(u, date);
    var yesterday = meals(u, date.minusDays(1));
    int count = 0;
    for (Meal m : yesterday) {
      if (meals.existsByUserIdAndDateAndCopiedFrom(u, date, m.id)) continue;
      Meal copy =
          log(
              u,
              new MealRequest(
                  date,
                  m.mealType,
                  m.items.stream().map(i -> new Item(i.foodId, i.grams)).toList()));
      copy.copiedFrom = m.id;
      meals.save(copy);
      count++;
    }
    return count;
  }

  @Transactional
  public WaterEntry water(UUID u, Water d) {
    date(u, d.date());
    snapshot(u, d.date());
    WaterEntry e = new WaterEntry();
    e.userId = u;
    e.date = d.date();
    e.ml = d.ml();
    waters.save(e);
    events.record(u, "WATER_LOGGED");
    return e;
  }

  @Transactional
  public void deleteWater(UUID u, UUID id) {
    waters.delete(
        waters
            .findByIdAndUserId(id, u)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found")));
  }

  @Transactional
  public WeightEntry weight(UUID u, Weight d) {
    date(u, d.date());
    snapshot(u, d.date());
    WeightEntry e = weights.findByUserIdAndDate(u, d.date()).orElseGet(WeightEntry::new);
    e.userId = u;
    e.date = d.date();
    e.kg = d.kg();
    weights.saveAndFlush(e);
    var p = profileService.require(u);
    var history =
        weights.findByUserIdAndDateBetweenOrderByDateAsc(u, LocalDate.of(1900, 1, 1), today(u));
    p.weight = history.get(history.size() - 1).kg;
    profiles.save(p);
    events.record(u, "WEIGHT_UPDATED");
    return e;
  }

  @Transactional
  public ActivityEntry activity(UUID u, Activity d) {
    date(u, d.date());
    snapshot(u, d.date());
    ActivityEntry e = activities.findByUserIdAndDate(u, d.date()).orElseGet(ActivityEntry::new);
    e.userId = u;
    e.date = d.date();
    e.steps = d.steps();
    e.minutes = d.minutes();
    activities.save(e);
    events.record(u, "ACTIVITY_LOGGED");
    return e;
  }

  @Transactional
  public UserProfile goals(UUID u, Targets d) {
    UserProfile p = profileService.require(u);
    double macroEnergy = 4 * d.protein() + 4 * d.carbs() + 9 * d.fat();
    if (Math.abs(macroEnergy - d.calories()) / d.calories() > .1)
      throw new IllegalArgumentException(
          "Macro energy must be within 10% of calories (protein ×4 + carbs ×4 + fat ×9)");
    p.calorieTarget = d.calories();
    p.proteinTarget = d.protein();
    p.carbsTarget = d.carbs();
    p.fatTarget = d.fat();
    p.fiberTarget = d.fiber();
    p.waterTarget = d.water();
    profiles.save(p);
    events.record(u, "GOAL_UPDATED");
    return p;
  }

  public List<SavedMeal> saved(UUID u) {
    return saved.findByUserId(u);
  }

  @Transactional
  public SavedMeal save(UUID u, Saved d) {
    if (d.plannedDate() != null
        && (d.plannedDate().isBefore(today(u)) || d.plannedDate().isAfter(today(u).plusDays(90))))
      throw new IllegalArgumentException("Plan for today or the next 90 days");
    d.items().forEach(i -> foods.accessible(i.foodId(), u));
    SavedMeal s = new SavedMeal();
    s.userId = u;
    s.name = d.name();
    s.mealType = d.mealType();
    s.plannedDate = d.plannedDate();
    try {
      s.items = mapper.writeValueAsString(d.items());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid meal items");
    }
    saved.save(s);
    events.record(u, "MEAL_PLAN_CREATED");
    return s;
  }

  @Transactional
  public Meal logSaved(UUID u, UUID id, LocalDate date) {
    SavedMeal s =
        saved
            .findByIdAndUserId(id, u)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved meal not found"));
    try {
      return log(
          u,
          new MealRequest(
              date, s.mealType, mapper.readValue(s.items, new TypeReference<List<Item>>() {})));
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
      throw new IllegalArgumentException("Invalid saved meal");
    }
  }

  @Transactional
  public void deleteSaved(UUID u, UUID id) {
    saved.delete(
        saved
            .findByIdAndUserId(id, u)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved meal not found")));
  }

  public Map<String, Object> dashboard(UUID u, LocalDate d) {
    date(u, d);
    var p = profileService.require(u);
    var dayMeals = meals(u, d);
    var items = dayMeals.stream().flatMap(m -> m.items.stream()).toList();
    var water = waters.findByUserIdAndDateBetweenOrderByDateAsc(u, d, d);
    var activity = activities.findByUserIdAndDate(u, d);
    Map<String, Object> total = new LinkedHashMap<>();
    total.put("calories", items.stream().mapToDouble(i -> i.calories).sum());
    total.put("protein", items.stream().mapToDouble(i -> i.protein).sum());
    total.put("carbs", items.stream().mapToDouble(i -> i.carbs).sum());
    total.put("fat", items.stream().mapToDouble(i -> i.fat).sum());
    total.put("fiber", items.stream().mapToDouble(i -> i.fiber).sum());
    total.put("sugar", items.stream().mapToDouble(i -> i.sugar).sum());
    total.put("sodium", items.stream().mapToDouble(i -> i.sodium).sum());
    total.put("water", water.stream().mapToInt(i -> i.ml).sum());
    total.put("steps", activity.map(i -> i.steps).orElse(0));
    total.put("minutes", activity.map(i -> i.minutes).orElse(0));
    total.put("incomplete", items.stream().anyMatch(i -> i.incomplete));
    var history = weights.findByUserIdAndDateBetweenOrderByDateAsc(u, LocalDate.of(1900, 1, 1), d);
    double kg = history.isEmpty() ? p.startWeight : history.get(history.size() - 1).kg;
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("date", d);
    out.put("totals", total);
    out.put("target", target(u, d));
    out.put("meals", dayMeals);
    out.put("waterEntries", water);
    out.put("weight", kg);
    out.put("bmi", kg / Math.pow(p.height / 100, 2));
    out.put("targetSnapshot", targets.findByUserIdAndDate(u, d).isPresent());
    return out;
  }
}
