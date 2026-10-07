package com.fitplix.analytics;

public final class ScoreCalculator {
  private ScoreCalculator() {}

  public static double clamp(double x) {
    return Math.max(0, Math.min(1, x));
  }

  public static double progress(String goal, double start, double current, double target) {
    if (goal.equals("MAINTAIN") || Math.abs(target - start) < .01)
      return Math.abs(current - start) <= start * .02 ? 1 : 0;
    return clamp((current - start) / (target - start));
  }

  public static double score(
      boolean tracked,
      double calories,
      double calorieTarget,
      double protein,
      double proteinTarget,
      double water,
      double waterTarget,
      int steps,
      int minutes,
      boolean logged,
      double progress) {
    if (!tracked) return 0;
    return 25 * (logged && Math.abs(calories - calorieTarget) <= .1 * calorieTarget ? 1 : 0)
        + 20 * clamp(protein / proteinTarget)
        + 15 * clamp(water / waterTarget)
        + 15 * clamp(Math.max(steps / 8000.0, minutes / 30.0))
        + 15 * (logged ? 1 : 0)
        + 10 * clamp(progress);
  }
}
