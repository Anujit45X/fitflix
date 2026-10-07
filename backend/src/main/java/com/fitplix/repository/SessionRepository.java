package com.fitplix.repository;

import com.fitplix.entity.AuthSession;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<AuthSession, UUID> {
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  java.util.Optional<AuthSession> findByRefreshHash(String hash);
}
