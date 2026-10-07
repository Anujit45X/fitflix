package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "meal")
public class Meal {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;
  public LocalDate date;

  @Column(length = 16)
  public String mealType;

  public Instant createdAt = Instant.now();
  public UUID copiedFrom;

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JoinColumn(name = "meal_id", nullable = false)
  public List<MealItem> items = new ArrayList<>();
}
