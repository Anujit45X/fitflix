package com.fitplix.repository;

import com.fitplix.entity.UserProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<UserProfile, UUID> {}
