package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "weight_entry")
public class WeightEntry {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;
  public LocalDate date;
  public double kg;
}
