package com.fitplix.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;

public final class NutritionDtos {
  public record Item(@NotNull Long foodId, @DecimalMin("1") @DecimalMax("2000") double grams) {}

  public record MealRequest(
      @NotNull LocalDate date,
      @NotNull @Pattern(regexp = "BREAKFAST|LUNCH|DINNER|SNACKS") String mealType,
      @NotEmpty @Size(max = 30) List<@Valid Item> items) {}

  public record Copy(@NotNull LocalDate date) {}

  public record Water(@NotNull LocalDate date, @Min(1) @Max(3000) int ml) {}

  public record Weight(@NotNull LocalDate date, @DecimalMin("30") @DecimalMax("350") double kg) {}

  public record Activity(
      @NotNull LocalDate date, @Min(0) @Max(100000) int steps, @Min(0) @Max(600) int minutes) {}

  public record CustomFood(
      @NotBlank @Size(max = 300) String name,
      @NotBlank @Size(max = 100) String category,
      @DecimalMin("0") @DecimalMax("1000") double calories,
      @DecimalMin("0") @DecimalMax("100") double protein,
      @DecimalMin("0") @DecimalMax("100") double carbs,
      @DecimalMin("0") @DecimalMax("100") double fat,
      @DecimalMin("0") @DecimalMax("100") double fiber,
      @DecimalMin("0") @DecimalMax("100") double sugar,
      @DecimalMin("0") @DecimalMax("50000") double sodium) {}

  public record Saved(
      @NotBlank @Size(max = 100) String name,
      @Pattern(regexp = "BREAKFAST|LUNCH|DINNER|SNACKS") @NotNull String mealType,
      @NotEmpty @Size(max = 30) List<@Valid Item> items,
      LocalDate plannedDate) {}

  public record Targets(
      @DecimalMin("1200") @DecimalMax("5000") double calories,
      @DecimalMin("30") @DecimalMax("300") double protein,
      @DecimalMin("0") @DecimalMax("700") double carbs,
      @DecimalMin("20") @DecimalMax("200") double fat,
      @DecimalMin("10") @DecimalMax("60") double fiber,
      @Min(500) @Max(6000) int water) {}

  public record Favorite(@NotNull Long foodId) {}
}
