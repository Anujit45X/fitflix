package com.fitplix.controller;

import com.fitplix.service.WellnessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api", "/api/v1"})
public class WellnessController {
  private final WellnessService service;

  public WellnessController(WellnessService s) {
    service = s;
  }

  public record Schedule(@NotBlank @Size(max = 40) String templateId, @NotNull LocalDate date) {}

  public record Completion(@NotNull Boolean completed) {}

  @GetMapping("/foods/{id}/servings")
  public Object servings(Authentication a, @PathVariable long id) {
    return service.servings((UUID) a.getPrincipal(), id);
  }

  @GetMapping("/recipes")
  public Object recipes() {
    return service.recipes();
  }

  @GetMapping("/workouts/templates")
  public Object templates() {
    return service.templates();
  }

  @GetMapping("/workouts")
  public Object records(
      Authentication a, @RequestParam LocalDate from, @RequestParam LocalDate to) {
    return service.records((UUID) a.getPrincipal(), from, to);
  }

  @PostMapping("/workouts")
  public Object schedule(Authentication a, @Valid @RequestBody Schedule d) {
    service.schedule((UUID) a.getPrincipal(), d.templateId(), d.date());
    return Map.of("ok", true);
  }

  @PutMapping("/workouts/{id}")
  public Object complete(
      Authentication a, @PathVariable UUID id, @Valid @RequestBody Completion d) {
    service.complete((UUID) a.getPrincipal(), id, d.completed());
    return Map.of("ok", true);
  }

  @DeleteMapping("/workouts/{id}")
  public Object delete(Authentication a, @PathVariable UUID id) {
    service.delete((UUID) a.getPrincipal(), id);
    return Map.of("ok", true);
  }
}
