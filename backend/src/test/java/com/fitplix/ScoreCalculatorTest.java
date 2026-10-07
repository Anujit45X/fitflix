package com.fitplix;

import static org.junit.jupiter.api.Assertions.*;

import com.fitplix.analytics.ScoreCalculator;
import org.junit.jupiter.api.Test;

class ScoreCalculatorTest {
  @Test
  void noDataNeverBecomesPerfectScore() {
    assertEquals(0, ScoreCalculator.score(false, 0, 2000, 0, 120, 0, 2500, 0, 0, false, 1));
  }

  @Test
  void perfectDayIsCapped() {
    assertEquals(
        100, ScoreCalculator.score(true, 2000, 2000, 180, 120, 4000, 2500, 15000, 60, true, 1));
  }

  @Test
  void asymmetricWeightGoalsAndMaintenance() {
    assertEquals(.5, ScoreCalculator.progress("LOSE", 80, 75, 70));
    assertEquals(.5, ScoreCalculator.progress("GAIN", 60, 65, 70));
    assertEquals(0, ScoreCalculator.progress("LOSE", 80, 85, 70));
    assertEquals(1, ScoreCalculator.progress("MAINTAIN", 70, 71, 70));
    assertEquals(0, ScoreCalculator.progress("MAINTAIN", 70, 73, 70));
  }

  @Test
  void boundaryCaloriesAndFractionalInputs() {
    assertEquals(85, ScoreCalculator.score(true, 1800, 2000, 120, 120, 2500, 2500, 0, 0, true, 1));
    assertEquals(60, ScoreCalculator.score(true, 1799, 2000, 120, 120, 2500, 2500, 0, 0, true, 1));
  }
}
