package com.fitplix.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "food")
public class Food {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(length = 300)
  public String name;

  @Column(length = 100)
  public String category;

  public double calories, protein, carbs, fat;
  public Double fiber, sugar, sodium;
  public double servingGrams = 100;

  @Column(length = 200)
  public String source;

  @Column(length = 64)
  public String sourceId;

  public UUID ownerId;
}
