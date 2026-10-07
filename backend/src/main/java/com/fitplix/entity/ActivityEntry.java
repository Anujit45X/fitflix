package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "activity_entry")
public class ActivityEntry {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;
  public LocalDate date;
  public int steps, minutes;
}
