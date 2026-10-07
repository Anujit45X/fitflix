package com.fitplix.repository;

import com.fitplix.entity.Meal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealRepository extends JpaRepository<Meal, UUID> {
  List<Meal> findByUserIdAndDateBetweenOrderByDateAsc(UUID userId, LocalDate from, LocalDate to);

  Optional<Meal> findByIdAndUserId(UUID id, UUID userId);

  boolean existsByUserIdAndDateAndCopiedFrom(UUID userId, LocalDate date, UUID copiedFrom);
}
