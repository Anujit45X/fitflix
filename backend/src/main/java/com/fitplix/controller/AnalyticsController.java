package com.fitplix.controller;

import com.fitplix.analytics.PersonalAnalyticsService;
import com.fitplix.service.NutritionService;
import java.time.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/analytics", "/api/v1/analytics"})
public class AnalyticsController {
  private final PersonalAnalyticsService analytics;
  private final NutritionService nutrition;

  public AnalyticsController(PersonalAnalyticsService a, NutritionService n) {
    analytics = a;
    nutrition = n;
  }

  @GetMapping({"/summary", "/calories", "/macros", "/weight", "/hydration", "/insights"})
  public Object summary(
      Authentication a,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to) {
    UUID id = (UUID) a.getPrincipal();
    if (to == null) to = nutrition.today(id);
    if (from == null) from = to.minusDays(29);
    return analytics.summary(id, from, to);
  }
}
