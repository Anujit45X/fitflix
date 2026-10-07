package com.fitplix.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser {
  @Id public UUID id = UUID.randomUUID();

  @Column(nullable = false, unique = true, length = 254)
  public String email;

  @Column(nullable = false, length = 80)
  public String name;

  @Column(nullable = false, length = 100)
  public String passwordHash;

  @Column(nullable = false, length = 24)
  public String role = "USER";

  public Instant createdAt = Instant.now();
  public boolean demo = false;
}
