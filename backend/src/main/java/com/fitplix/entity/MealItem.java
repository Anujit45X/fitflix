package com.fitplix.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "meal_item")
public class MealItem {
  @Id public UUID id = UUID.randomUUID();
  public Long foodId;

  @Column(length = 300)
  public String name;

  public double grams, calories, protein, carbs, fat, fiber, sugar, sodium;
  public boolean incomplete;
}
