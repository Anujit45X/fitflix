package com.fitplix.repository;

import com.fitplix.entity.WeightEntry;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeightEntryRepository extends JpaRepository<WeightEntry, UUID> {
  List<WeightEntry> findByUserIdAndDateBetweenOrderByDateAsc(
      UUID userId, LocalDate from, LocalDate to);

  Optional<WeightEntry> findByIdAndUserId(UUID id, UUID userId);

  Optional<WeightEntry> findByUserIdAndDate(UUID userId, LocalDate date);
}
