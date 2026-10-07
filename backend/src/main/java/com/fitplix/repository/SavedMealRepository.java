package com.fitplix.repository;

import com.fitplix.entity.SavedMeal;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedMealRepository extends JpaRepository<SavedMeal, UUID> {
  List<SavedMeal> findByUserId(UUID userId);

  Optional<SavedMeal> findByIdAndUserId(UUID id, UUID userId);
}
