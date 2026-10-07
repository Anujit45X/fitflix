package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profile")
public class UserProfile {
  @Id public UUID userId;
  public int age;

  @Column(length = 12)
  public String sex;

  public double height, weight, startWeight, targetWeight;
  @Column(length = 16)
  public String activity, goal;

  @Column(length = 24)
  public String diet;

  public int waterTarget;
  public double calorieTarget, proteinTarget, carbsTarget, fatTarget, fiberTarget = 30;

  @Column(length = 64)
  public String timezone = "Asia/Kolkata";

  public Instant updatedAt = Instant.now();
}
