package com.fitplix.repository;

import com.fitplix.entity.AnalyticsEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<AnalyticsEvent, UUID> {}
