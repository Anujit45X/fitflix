package com.fitplix.analytics;

import com.fitplix.entity.*;
import com.fitplix.repository.*;
import com.fitplix.service.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class PersonalAnalyticsService {
  private final MealRepository meals;
  private final WaterEntryRepository waters;
  private final WeightEntryRepository weights;
  private final ActivityEntryRepository activities;
  private final DailyTargetRepository targets;
  private final ProfileService profiles;
  private final NutritionService nutrition;

  public PersonalAnalyticsService(
      MealRepository m,
      WaterEntryRepository w,
      WeightEntryRepository kg,
      ActivityEntryRepository a,
      DailyTargetRepository t,
      ProfileService p,
      NutritionService n) {
    meals = m;
    waters = w;
    weights = kg;
    activities = a;
    targets = t;
    profiles = p;
    nutrition = n;
  }

  public Map<String, Object> summary(UUID u, LocalDate from, LocalDate to) {
    if (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > 89)
      throw new IllegalArgumentException("Choose a range from 1 to 90 days");
    nutrition.date(u, from);
    nutrition.date(u, to);
    var p = profiles.require(u);
    var ms = meals.findByUserIdAndDateBetweenOrderByDateAsc(u, from, to);
    var ws = waters.findByUserIdAndDateBetweenOrderByDateAsc(u, from, to);
    var ks = weights.findByUserIdAndDateBetweenOrderByDateAsc(u, LocalDate.of(1900, 1, 1), to);
    var acts = activities.findByUserIdAndDateBetweenOrderByDateAsc(u, from, to);
    var ts = targets.findByUserIdAndDateBetweenOrderByDateAsc(u, from, to);
    Map<LocalDate, DailyTarget> tm = new HashMap<>();
    ts.forEach(t -> tm.put(t.date, t));
    List<Map<String, Object>> days = new ArrayList<>();
    Map<String, Double> byMeal = new LinkedHashMap<>();
    for (String type : List.of("BREAKFAST", "LUNCH", "DINNER", "SNACKS")) byMeal.put(type, 0.0);
    double calories = 0, protein = 0, carbs = 0, fat = 0, water = 0, scores = 0;
    int logged = 0, adherent = 0, proteinDays = 0, hydrationDays = 0, goalDays = 0;
    double lastWeight = p.startWeight;
    for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
      final LocalDate date = day;
      var mm = ms.stream().filter(m -> m.date.equals(date)).toList();
      var ii = mm.stream().flatMap(m -> m.items.stream()).toList();
      double c = ii.stream().mapToDouble(i -> i.calories).sum(),
          pr = ii.stream().mapToDouble(i -> i.protein).sum(),
          ca = ii.stream().mapToDouble(i -> i.carbs).sum(),
          f = ii.stream().mapToDouble(i -> i.fat).sum();
      int wa = ws.stream().filter(w -> w.date.equals(date)).mapToInt(w -> w.ml).sum();
      var ac = acts.stream().filter(a -> a.date.equals(date)).findFirst();
      var t = tm.getOrDefault(date, fallback(p, date));
      var known = ks.stream().filter(k -> !k.date.isAfter(date)).toList();
      lastWeight = known.isEmpty() ? p.startWeight : known.get(known.size() - 1).kg;
      Double actualWeight =
          ks.stream().filter(k -> k.date.equals(date)).map(k -> k.kg).findFirst().orElse(null);
      var trailing =
          ks.stream()
              .filter(k -> !k.date.isAfter(date) && !k.date.isBefore(date.minusDays(6)))
              .toList();
      Double rolling =
          trailing.isEmpty() ? null : trailing.stream().mapToDouble(k -> k.kg).average().orElse(0);
      boolean hasMeal = !mm.isEmpty(),
          calOk = hasMeal && Math.abs(c - t.calories) <= .1 * t.calories,
          proOk = hasMeal && pr >= t.protein;
      boolean tracked = hasMeal || wa > 0 || ac.isPresent() || actualWeight != null;
      int steps = ac.map(a -> a.steps).orElse(0), minutes = ac.map(a -> a.minutes).orElse(0);
      double prog = ScoreCalculator.progress(p.goal, p.startWeight, lastWeight, p.targetWeight);
      double score =
          ScoreCalculator.score(
              tracked, c, t.calories, pr, t.protein, wa, t.water, steps, minutes, hasMeal, prog);
      if (hasMeal) logged++;
      if (calOk) adherent++;
      if (proOk) proteinDays++;
      if (wa >= t.water) hydrationDays++;
      if (calOk && proOk && wa >= t.water) goalDays++;
      calories += c;
      protein += pr;
      carbs += ca;
      fat += f;
      water += wa;
      scores += score;
      for (var m : mm)
        byMeal.compute(
            m.mealType, (key, v) -> v + m.items.stream().mapToDouble(i -> i.calories).sum());
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("date", date);
      row.put("calories", c);
      row.put("protein", pr);
      row.put("carbs", ca);
      row.put("fat", f);
      row.put("water", wa);
      row.put("weight", actualWeight);
      row.put("rollingWeight", rolling);
      row.put("calorieTarget", t.calories);
      row.put("proteinTarget", t.protein);
      row.put("waterTarget", t.water);
      row.put("steps", steps);
      row.put("score", score);
      row.put("logged", hasMeal);
      row.put("calorieAdherent", calOk);
      row.put("targetSnapshot", tm.containsKey(date));
      days.add(row);
    }
    int n = days.size();
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("from", from);
    out.put("to", to);
    out.put("days", days);
    out.put("trackedDays", logged);
    out.put("totalDays", n);
    out.put("averageCalories", calories / n);
    out.put("averageProtein", protein / n);
    out.put("averageCarbs", carbs / n);
    out.put("averageFat", fat / n);
    out.put("averageWater", water / n);
    var rangeWeights = ks.stream().filter(k -> !k.date.isBefore(from)).toList();
    out.put(
        "averageWeight",
        rangeWeights.isEmpty()
            ? null
            : rangeWeights.stream().mapToDouble(k -> k.kg).average().orElse(0));
    out.put("calorieAdherence", logged == 0 ? null : 100.0 * adherent / logged);
    out.put("proteinAchievement", logged == 0 ? null : 100.0 * proteinDays / logged);
    out.put("loggingConsistency", 100.0 * logged / n);
    out.put("hydrationAdherence", 100.0 * hydrationDays / n);
    out.put("goalCompletion", 100.0 * goalDays / n);
    out.put("score", scores / n);
    out.put(
        "weightProgress",
        100 * ScoreCalculator.progress(p.goal, p.startWeight, lastWeight, p.targetWeight));
    out.put("startWeight", p.startWeight);
    out.put("currentWeight", lastWeight);
    out.put("targetWeight", p.targetWeight);
    out.put("mealDistribution", byMeal);
    out.put(
        "macroEnergy", Map.of("Protein", protein * 4, "Carbohydrates", carbs * 4, "Fat", fat * 9));
    out.put("insights", insights(days, logged, adherent, byMeal));
    return out;
  }

  private DailyTarget fallback(UserProfile p, LocalDate d) {
    DailyTarget t = new DailyTarget();
    t.date = d;
    t.calories = p.calorieTarget;
    t.protein = p.proteinTarget;
    t.water = p.waterTarget;
    return t;
  }

  private double number(Map<String, Object> d, String k) {
    return ((Number) d.get(k)).doubleValue();
  }

  private List<Map<String, String>> insights(
      List<Map<String, Object>> days, int logged, int adherent, Map<String, Double> byMeal) {
    List<Map<String, String>> list = new ArrayList<>();
    if (logged == 0) {
      list.add(
          insight(
              "Your story starts with one meal",
              "0 meal-tracked days in this range",
              "Log a meal to unlock intake patterns."));
      return list;
    }
    list.add(
        insight(
            "Consistency builds useful context",
            logged + " of " + days.size() + " days include meals",
            "A quick daily check-in can make trends easier to understand."));
    list.add(
        insight(
            "Your calorie target is a reference point",
            adherent + " of " + logged + " tracked days were within ±10% of target",
            "Look for patterns across several days, rather than compensating for one meal."));
    double pr =
        days.stream()
            .filter(d -> Boolean.TRUE.equals(d.get("logged")))
            .mapToDouble(d -> number(d, "protein") / number(d, "proteinTarget"))
            .average()
            .orElse(0);
    list.add(
        insight(
            "Protein across your tracked days",
            Math.round(pr * 100) + "% average fulfillment of daily protein targets",
            "Consider a protein source you enjoy as part of regular meals."));
    var largest = byMeal.entrySet().stream().max(Map.Entry.comparingByValue()).orElseThrow();
    double total = byMeal.values().stream().mapToDouble(Double::doubleValue).sum();
    if (total > 0)
      list.add(
          insight(
              "Your largest meal contribution",
              largest.getKey().toLowerCase()
                  + " contributes "
                  + Math.round(largest.getValue() / total * 100)
                  + "% of logged calories",
              "Use this pattern when planning meals that suit your routine."));
    if (days.size() >= 14) {
      double
          recent =
              days.subList(days.size() - 7, days.size()).stream()
                  .mapToDouble(d -> number(d, "water"))
                  .average()
                  .orElse(0),
          prior =
              days.subList(days.size() - 14, days.size() - 7).stream()
                  .mapToDouble(d -> number(d, "water"))
                  .average()
                  .orElse(0);
      if (prior > 0)
        list.add(
            insight(
                "Your hydration trend",
                Math.round((recent - prior) / prior * 100)
                    + "% change in logged water versus the previous 7 days",
                "Keep water accessible and use your personal target as a guide."));
    }
    return list;
  }

  private Map<String, String> insight(String title, String metric, String action) {
    return Map.of("observation", title, "metric", metric, "action", action);
  }
}
