package com.fitplix.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "favorite_food")
public class FavoriteFood {
  @Id public UUID id = UUID.randomUUID();
  public UUID userId;
  public Long foodId;
}
