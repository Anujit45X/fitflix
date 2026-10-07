package com.fitplix.service;

import com.fitplix.dto.ProfileRequest;
import com.fitplix.entity.*;
import com.fitplix.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
  private final ProfileRepository profiles;
  private final EventService events;
  private final ExperimentService experiments;

  public ProfileService(ProfileRepository p, EventService e, ExperimentService x) {
    profiles = p;
    events = e;
    experiments = x;
  }

  public UserProfile require(UUID id) {
    return profiles
        .findById(id)
        .orElseThrow(() -> new IllegalStateException("Complete onboarding first"));
  }

  @Transactional
  public UserProfile save(UUID id, ProfileRequest d) {
    try {
      ZoneId.of(d.timezone());
    } catch (Exception e) {
      throw new IllegalArgumentException("Choose a valid timezone");
    }
    if (d.goal().equals("LOSE") && d.targetWeight() >= d.weight()
        || d.goal().equals("GAIN") && d.targetWeight() <= d.weight())
      throw new IllegalArgumentException("Target weight must match your goal direction");
    boolean first = !profiles.existsById(id);
    UserProfile p = profiles.findById(id).orElseGet(UserProfile::new);
    p.userId = id;
    p.age = d.age();
    p.sex = d.sex();
    p.height = d.height();
    p.weight = d.weight();
    if (first) p.startWeight = d.weight();
    p.targetWeight = d.targetWeight();
    p.activity = d.activity();
    p.goal = d.goal();
    p.diet = d.diet();
    p.waterTarget = d.waterTarget();
    p.timezone = d.timezone();
    p.updatedAt = Instant.now();
    double bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex.equals("MALE") ? 5 : -161);
    double mult =
        switch (p.activity) {
          case "LIGHT" -> 1.375;
          case "MODERATE" -> 1.55;
          case "VERY_ACTIVE" -> 1.725;
          default -> 1.2;
        };
    p.calorieTarget =
        Math.round(
            Math.max(
                p.sex.equals("MALE") ? 1500 : 1200,
                bmr * mult + (p.goal.equals("LOSE") ? -300 : p.goal.equals("GAIN") ? 250 : 0)));
    p.proteinTarget = Math.round(p.weight * (p.goal.equals("GAIN") ? 1.8 : 1.6));
    p.fatTarget = Math.round(p.calorieTarget * .28 / 9);
    p.carbsTarget =
        Math.round(Math.max(0, (p.calorieTarget - p.proteinTarget * 4 - p.fatTarget * 9) / 4));
    profiles.save(p);
    events.record(id, first ? "ONBOARDING_COMPLETED" : "GOAL_UPDATED");
    if (first) {
      events.record(id, "CALORIE_GOAL_GENERATED");
      experiments.assign(id);
    }
    return p;
  }
}
