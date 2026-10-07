package com.fitplix.analytics;

import java.time.*;
import java.time.temporal.*;
import java.util.*;
import java.util.stream.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ProductAnalyticsService {
  private final JdbcTemplate jdbc;

  public ProductAnalyticsService(JdbcTemplate j) {
    jdbc = j;
  }

  private record User(UUID id, String name, Instant joined) {}

  private record Event(UUID user, String name, Instant time) {
    LocalDate date() {
      return time.atZone(ZoneOffset.UTC).toLocalDate();
    }
  }

  private static final Set<String> ACTIVE =
      Set.of(
          "USER_LOGIN",
          "MEAL_LOGGED",
          "FOOD_SEARCHED",
          "WATER_LOGGED",
          "WEIGHT_UPDATED",
          "ACTIVITY_LOGGED",
          "ANALYTICS_VIEWED",
          "MEAL_PLAN_CREATED",
          "GOAL_UPDATED");

  private static Double pct(long n, long d) {
    return d == 0 ? null : 100.0 * n / d;
  }

  private static LocalDate date(Instant i) {
    return i.atZone(ZoneOffset.UTC).toLocalDate();
  }

  public Map<String, Object> report(boolean demo, LocalDate from, LocalDate to) {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    if (from.isAfter(to) || to.isAfter(today) || ChronoUnit.DAYS.between(from, to) > 89)
      throw new IllegalArgumentException("Choose 1–90 UTC dates, ending no later than today");
    Instant end = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    var users =
        jdbc.query(
            "select id,name,created_at from app_user where demo=? and created_at<? order by"
                + " created_at",
            (rs, i) ->
                new User(
                    rs.getObject(1, UUID.class), rs.getString(2), rs.getTimestamp(3).toInstant()),
            demo,
            java.sql.Timestamp.from(end));
    var events =
        jdbc.query(
            "select e.user_id,e.event_name,e.occurred_at from analytics_event e join app_user u on"
                + " u.id=e.user_id where u.demo=? and e.occurred_at<? order by e.occurred_at",
            (rs, i) ->
                new Event(
                    rs.getObject(1, UUID.class), rs.getString(2), rs.getTimestamp(3).toInstant()),
            demo,
            java.sql.Timestamp.from(end));
    Map<UUID, List<Event>> per = events.stream().collect(Collectors.groupingBy(Event::user));
    Map<UUID, User> byId = users.stream().collect(Collectors.toMap(User::id, u -> u));
    var window =
        events.stream().filter(e -> !e.date().isBefore(from) && !e.date().isAfter(to)).toList();
    var cohort =
        users.stream()
            .filter(u -> !date(u.joined).isBefore(from) && !date(u.joined).isAfter(to))
            .toList();
    long dau = active(events, to, to),
        wau = active(events, to.minusDays(6), to),
        mau = active(events, to.minusDays(29), to),
        mealUsers =
            window.stream()
                .filter(e -> e.name.equals("MEAL_LOGGED"))
                .map(Event::user)
                .distinct()
                .count(),
        mealCount = window.stream().filter(e -> e.name.equals("MEAL_LOGGED")).count();
    List<User> mature =
        cohort.stream()
            .filter(
                u ->
                    date(u.joined).plusDays(6).isBefore(today)
                        && !date(u.joined).plusDays(6).isAfter(to))
            .toList();
    long activated =
        mature.stream()
            .filter(
                u -> {
                  var es = per.getOrDefault(u.id, List.of());
                  return es.stream()
                          .anyMatch(
                              e ->
                                  e.name.equals("ONBOARDING_COMPLETED")
                                      && !e.time.isBefore(u.joined)
                                      && e.date().isBefore(date(u.joined).plusDays(7)))
                      && es.stream()
                          .anyMatch(
                              e ->
                                  e.name.equals("MEAL_LOGGED")
                                      && !e.time.isBefore(u.joined)
                                      && e.date().isBefore(date(u.joined).plusDays(7)));
                })
            .count();
    Map<String, Object> kpi = new LinkedHashMap<>();
    kpi.put("totalUsers", users.size());
    kpi.put("dau", dau);
    kpi.put("wau", wau);
    kpi.put("mau", mau);
    kpi.put("stickiness", pct(dau, mau));
    kpi.put("newUsers", cohort.size());
    kpi.put("activationRate", pct(activated, mature.size()));
    kpi.put("activationEligible", mature.size());
    kpi.put(
        "onboardedUsers",
        events.stream()
            .filter(e -> e.name.equals("ONBOARDING_COMPLETED"))
            .map(Event::user)
            .distinct()
            .count());
    kpi.put("mealLoggingRate", pct(mealUsers, users.size()));
    kpi.put("averageMealsPerUser", users.isEmpty() ? null : (double) mealCount / users.size());
    kpi.put("mealsLogged", mealCount);
    List<Map<String, Object>> retention = new ArrayList<>();
    for (int n : List.of(1, 7, 30)) {
      var eligible =
          cohort.stream()
              .filter(
                  u ->
                      date(u.joined).plusDays(n).isBefore(today)
                          && !date(u.joined).plusDays(n).isAfter(to))
              .toList();
      long retained =
          eligible.stream()
              .filter(
                  u ->
                      per.getOrDefault(u.id, List.of()).stream()
                          .anyMatch(
                              e ->
                                  ACTIVE.contains(e.name)
                                      && e.date().equals(date(u.joined).plusDays(n))))
              .count();
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("day", n);
      row.put("eligible", eligible.size());
      row.put("retained", retained);
      row.put("rate", pct(retained, eligible.size()));
      retention.add(row);
    }
    Map<String, String> features = new LinkedHashMap<>();
    features.put("Food tracking", "MEAL_LOGGED");
    features.put("Water tracking", "WATER_LOGGED");
    features.put("Weight tracking", "WEIGHT_UPDATED");
    features.put("Analytics", "ANALYTICS_VIEWED");
    features.put("Meal planning", "MEAL_PLAN_CREATED");
    List<Map<String, Object>> adoption = new ArrayList<>();
    for (var f : features.entrySet()) {
      long n =
          window.stream()
              .filter(e -> e.name.equals(f.getValue()))
              .map(Event::user)
              .distinct()
              .count();
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("feature", f.getKey());
      row.put("users", n);
      row.put("rate", pct(n, users.size()));
      adoption.add(row);
    }
    var visits =
        jdbc.queryForList(
            "select user_id,first_seen from visitor where demo=? and first_seen>=? and"
                + " first_seen<?",
            demo,
            java.sql.Timestamp.from(from.atStartOfDay(ZoneOffset.UTC).toInstant()),
            java.sql.Timestamp.from(end));
    long[] counts = {visits.size(), 0, 0, 0, 0, 0, 0};
    for (var v : visits) {
      User u = byId.get(v.get("user_id"));
      if (u == null) continue;
      Instant prev = ((java.sql.Timestamp) v.get("first_seen")).toInstant();
      if (u.joined.isBefore(prev)) continue;
      counts[1]++;
      prev = u.joined;
      boolean stop = false;
      var es = per.getOrDefault(u.id, List.of());
      int index = 2;
      for (String event :
          List.of("ONBOARDING_COMPLETED", "CALORIE_GOAL_GENERATED", "MEAL_LOGGED")) {
        final Instant after = prev;
        var found =
            es.stream().filter(e -> e.name.equals(event) && !e.time.isBefore(after)).findFirst();
        if (found.isEmpty()) {
          stop = true;
          break;
        }
        prev = found.get().time;
        counts[index++]++;
      }
      if (stop) continue;
      final Instant after = prev;
      var activeDays =
          es.stream()
              .filter(
                  e ->
                      ACTIVE.contains(e.name)
                          && !e.time.isBefore(after)
                          && e.date().isBefore(date(u.joined).plusDays(7)))
              .map(Event::date)
              .distinct()
              .sorted()
              .toList();
      if (activeDays.size() < 3) continue;
      counts[5]++;
      LocalDate d7 = date(u.joined).plusDays(7);
      if (es.stream()
          .anyMatch(e -> ACTIVE.contains(e.name) && e.date().equals(d7) && !e.time.isBefore(after)))
        counts[6]++;
    }
    List<Map<String, Object>> funnel = new ArrayList<>();
    String[] labels = {
      "Visitor",
      "Registration",
      "Profile setup",
      "Goal generated",
      "First meal",
      "3-day active",
      "7-day retained"
    };
    double biggest = -1;
    String drop = "Not enough data";
    for (int i = 0; i < counts.length; i++) {
      Double conversion = i == 0 ? Double.valueOf(100.0) : pct(counts[i], counts[i - 1]);
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("stage", labels[i]);
      row.put("users", counts[i]);
      row.put("conversion", conversion);
      funnel.add(row);
      if (i > 0 && conversion != null && 100 - conversion > biggest) {
        biggest = 100 - conversion;
        drop = labels[i - 1] + " → " + labels[i];
      }
    }
    Map<LocalDate, List<User>> grouped = new TreeMap<>();
    for (User u : users) {
      LocalDate w = date(u.joined).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
      if (w.isBefore(from.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)))) continue;
      grouped.computeIfAbsent(w, k -> new ArrayList<>()).add(u);
    }
    List<Map<String, Object>> cohorts = new ArrayList<>();
    for (var c : grouped.entrySet()) {
      List<Double> values = new ArrayList<>();
      for (int week = 0; week <= 4; week++) {
        LocalDate start = c.getKey().plusWeeks(week), finish = start.plusDays(6);
        if (!finish.isBefore(today) || finish.isAfter(to)) {
          values.add(null);
          continue;
        }
        long retained =
            c.getValue().stream()
                .filter(
                    u ->
                        per.getOrDefault(u.id, List.of()).stream()
                            .anyMatch(
                                e ->
                                    ACTIVE.contains(e.name)
                                        && !e.date().isBefore(start)
                                        && !e.date().isAfter(finish)))
                .count();
        values.add(pct(retained, c.getValue().size()));
      }
      cohorts.add(Map.of("week", c.getKey(), "size", c.getValue().size(), "retention", values));
    }
    Map<String, Integer> segments = new LinkedHashMap<>();
    for (String s : List.of("Highly engaged", "Moderately engaged", "At risk", "Inactive"))
      segments.put(s, 0);
    List<Map<String, Object>> userRows = new ArrayList<>();
    for (User u : users) {
      var active =
          per.getOrDefault(u.id, List.of()).stream().filter(e -> ACTIVE.contains(e.name)).toList();
      long active7 =
          active.stream()
              .filter(e -> !e.date().isBefore(to.minusDays(6)))
              .map(Event::date)
              .distinct()
              .count();
      long meal7 =
          active.stream()
              .filter(e -> e.name.equals("MEAL_LOGGED") && !e.date().isBefore(to.minusDays(6)))
              .map(Event::date)
              .distinct()
              .count();
      long idle =
          active.isEmpty()
              ? ChronoUnit.DAYS.between(date(u.joined), to)
              : ChronoUnit.DAYS.between(active.get(active.size() - 1).date(), to);
      String segment =
          idle >= 14
              ? "Inactive"
              : active7 >= 5 && meal7 >= 3
                  ? "Highly engaged"
                  : active7 >= 2 ? "Moderately engaged" : "At risk";
      segments.compute(segment, (k, v) -> v + 1);
      userRows.add(
          Map.of(
              "id",
              u.id,
              "name",
              u.name,
              "registered",
              date(u.joined),
              "activeDays7",
              active7,
              "daysSinceActivity",
              idle,
              "segment",
              segment));
    }
    var daily = new ArrayList<Map<String, Object>>();
    for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1))
      daily.add(Map.of("date", d, "activeUsers", active(events, d, d)));
    // Goal completion uses recorded meal-day target snapshots and actual persisted intake.
    var goal =
        jdbc.queryForMap(
            "with d as (select m.user_id,m.date,sum(i.calories) c,sum(i.protein) p from meal m join"
                + " meal_item i on i.meal_id=m.id join app_user u on u.id=m.user_id where u.demo=?"
                + " and m.date between ? and ? group by m.user_id,m.date), w as (select"
                + " user_id,date,sum(ml) ml from water_entry group by user_id,date) select count(*)"
                + " as eligible,count(*) filter(where abs(d.c-t.calories)<=t.calories*.1 and"
                + " d.p>=t.protein and coalesce(w.ml,0)>=t.water) as completed from d join"
                + " daily_target t on t.user_id=d.user_id and t.date=d.date left join w on"
                + " w.user_id=d.user_id and w.date=d.date",
            demo,
            from,
            to);
    kpi.put(
        "goalCompletion",
        pct(
            ((Number) goal.get("completed")).longValue(),
            ((Number) goal.get("eligible")).longValue()));
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("dataset", demo ? "SIMULATED DEMO USERS" : "REAL USERS");
    out.put("timezone", "UTC");
    out.put("from", from);
    out.put("to", to);
    out.put("kpis", kpi);
    out.put("retention", retention);
    out.put("adoption", adoption);
    out.put("funnel", funnel);
    out.put("largestDropoff", drop);
    out.put("cohorts", cohorts);
    out.put("segments", segments);
    out.put("users", userRows);
    out.put("daily", daily);
    out.put("experiment", experiment(demo, per, today, to));
    return out;
  }

  private long active(List<Event> events, LocalDate from, LocalDate to) {
    return events.stream()
        .filter(e -> ACTIVE.contains(e.name) && !e.date().isBefore(from) && !e.date().isAfter(to))
        .map(Event::user)
        .distinct()
        .count();
  }

  private Object experiment(
      boolean demo, Map<UUID, List<Event>> per, LocalDate today, LocalDate to) {
    var assignments =
        jdbc.queryForList(
            "select a.user_id,a.variant,a.assigned_at from experiment_assignment a join app_user u"
                + " on u.id=a.user_id where u.demo=? and a.experiment_id='onboarding-insight-v1'",
            demo);
    List<Map<String, Object>> variants = new ArrayList<>();
    for (String variant : List.of("A", "B")) {
      int assigned = 0, n = 0, d7n = 0, retained = 0, activated = 0;
      double mealDays = 0;
      for (var a : assignments) {
        if (!variant.equals(a.get("variant"))) continue;
        assigned++;
        LocalDate start = date(((java.sql.Timestamp) a.get("assigned_at")).toInstant());
        if (!start.plusDays(6).isBefore(today) || start.plusDays(6).isAfter(to)) continue;
        n++;
        var es = per.getOrDefault((UUID) a.get("user_id"), List.of());
        long logged =
            es.stream()
                .filter(
                    e ->
                        e.name.equals("MEAL_LOGGED")
                            && !e.date().isBefore(start)
                            && e.date().isBefore(start.plusDays(7)))
                .map(Event::date)
                .distinct()
                .count();
        mealDays += logged;
        if (logged > 0) activated++;
        if (start.plusDays(7).isBefore(today) && !start.plusDays(7).isAfter(to)) {
          d7n++;
          if (es.stream()
              .anyMatch(e -> ACTIVE.contains(e.name) && e.date().equals(start.plusDays(7))))
            retained++;
        }
      }
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("variant", variant);
      row.put("assigned", assigned);
      row.put("eligible", n);
      row.put("meanMealDays", n == 0 ? null : mealDays / n);
      row.put("activationRate", pct(activated, n));
      row.put("d7Eligible", d7n);
      row.put("retention", pct(retained, d7n));
      variants.add(row);
    }
    return Map.of(
        "name",
        "A clearer first step",
        "status",
        "EXPLORATORY · NO WINNER DECLARED",
        "hypothesis",
        "A personalized dashboard insight increases meal-logging days during the first seven days.",
        "primaryMetric",
        "Mean distinct meal-logging days, assignment days 0–6",
        "variants",
        variants,
        "disclosure",
        demo
            ? "Simulated assignments and outcomes. Not evidence of causal impact."
            : "Observed outcomes only. No significance or causal claim; exposure is not"
                + " independently verified.");
  }
}
