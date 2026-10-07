package com.fitplix.repository;

import com.fitplix.entity.AppUser;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
  java.util.Optional<AppUser> findByEmail(String email);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select u from AppUser u where u.email = :email")
  java.util.Optional<AppUser> findForLogin(
      @org.springframework.data.repository.query.Param("email") String email);
}
