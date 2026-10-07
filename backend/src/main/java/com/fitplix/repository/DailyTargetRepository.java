package com.fitplix.repository;

import com.fitplix.entity.DailyTarget;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyTargetRepository extends JpaRepository<DailyTarget, UUID> {
  List<DailyTarget> findByUserIdAndDateBetweenOrderByDateAsc(
      UUID userId, LocalDate from, LocalDate to);

  Optional<DailyTarget> findByIdAndUserId(UUID id, UUID userId);

  Optional<DailyTarget> findByUserIdAndDate(UUID userId, LocalDate date);
}
