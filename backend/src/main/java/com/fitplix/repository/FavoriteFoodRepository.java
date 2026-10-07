package com.fitplix.repository;

import com.fitplix.entity.FavoriteFood;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteFoodRepository extends JpaRepository<FavoriteFood, UUID> {
  List<FavoriteFood> findByUserId(UUID userId);

  Optional<FavoriteFood> findByIdAndUserId(UUID id, UUID userId);

  Optional<FavoriteFood> findByUserIdAndFoodId(UUID userId, Long foodId);
}
