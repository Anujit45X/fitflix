package com.fitplix.repository;

import com.fitplix.entity.Food;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;

public interface FoodRepository extends JpaRepository<Food, Long> {
  @Query(
      "select f from Food f where (f.ownerId is null or f.ownerId=:user) and lower(f.name) like"
          + " lower(concat('%',:search,'%')) and (:category='' or f.category=:category)")
  Page<Food> search(UUID user, String search, String category, Pageable pageable);

  @Query(
      "select distinct f.category from Food f where f.ownerId is null or f.ownerId=:user order by"
          + " f.category")
  List<String> categories(UUID user);
}
