package com.fitplix.repository;

import com.fitplix.entity.ActivityEntry;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityEntryRepository extends JpaRepository<ActivityEntry, UUID> {
  List<ActivityEntry> findByUserIdAndDateBetweenOrderByDateAsc(
      UUID userId, LocalDate from, LocalDate to);

  Optional<ActivityEntry> findByIdAndUserId(UUID id, UUID userId);

  Optional<ActivityEntry> findByUserIdAndDate(UUID userId, LocalDate date);
}
