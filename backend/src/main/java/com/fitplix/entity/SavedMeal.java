package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "saved_meal")
public class SavedMeal {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;

  @Column(length = 100)
  public String name;

  @Column(length = 16)
  public String mealType;

  @Column(columnDefinition = "text")
  public String items;

  public LocalDate plannedDate;
  public Instant createdAt = Instant.now();
}
