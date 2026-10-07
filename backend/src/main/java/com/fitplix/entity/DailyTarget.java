package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_target")
public class DailyTarget {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;
  public LocalDate date;
  public double calories, protein, carbs, fat, fiber;
  public int water;
}
