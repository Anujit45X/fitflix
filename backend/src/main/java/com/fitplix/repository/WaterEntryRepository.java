package com.fitplix.repository;

import com.fitplix.entity.WaterEntry;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaterEntryRepository extends JpaRepository<WaterEntry, UUID> {
  List<WaterEntry> findByUserIdAndDateBetweenOrderByDateAsc(
      UUID userId, LocalDate from, LocalDate to);

  Optional<WaterEntry> findByIdAndUserId(UUID id, UUID userId);
}
