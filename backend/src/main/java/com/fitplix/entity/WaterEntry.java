package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "water_entry")
public class WaterEntry {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;
  public LocalDate date;
  public int ml;
}
