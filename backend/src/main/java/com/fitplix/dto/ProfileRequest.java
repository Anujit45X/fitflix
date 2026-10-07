package com.fitplix.dto;

import jakarta.validation.constraints.*;

public record ProfileRequest(
    @Min(18) @Max(100) int age,
    @Pattern(regexp = "MALE|FEMALE") @NotNull String sex,
    @DecimalMin("100") @DecimalMax("250") double height,
    @DecimalMin("30") @DecimalMax("350") double weight,
    @DecimalMin("30") @DecimalMax("350") double targetWeight,
    @Pattern(regexp = "SEDENTARY|LIGHT|MODERATE|VERY_ACTIVE") @NotNull String activity,
    @Pattern(regexp = "LOSE|MAINTAIN|GAIN") @NotNull String goal,
    @Pattern(regexp = "ANY|VEGETARIAN|VEGAN") @NotNull String diet,
    @Min(500) @Max(6000) int waterTarget,
    @NotBlank String timezone) {}
