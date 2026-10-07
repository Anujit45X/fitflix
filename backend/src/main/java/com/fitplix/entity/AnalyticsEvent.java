package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analytics_event")
public class AnalyticsEvent {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;

  @Column(length = 64)
  public String eventName;

  public Instant occurredAt = Instant.now();

  @Column(columnDefinition = "text")
  public String metadata = "{}";
}
