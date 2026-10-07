package com.fitplix.service;

import com.fitplix.dto.NutritionDtos.*;
import com.fitplix.entity.*;
import com.fitplix.repository.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FoodService {
  private final FoodRepository foods;
  private final FavoriteFoodRepository favorites;
  private final EventService events;

  public FoodService(FoodRepository f, FavoriteFoodRepository fav, EventService e) {
    foods = f;
    favorites = fav;
    events = e;
  }

  public Food accessible(Long id, UUID user) {
    Food f =
        foods
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
    if (f.ownerId != null && !f.ownerId.equals(user))
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found");
    return f;
  }

  public Object search(UUID user, String q, String category, String sort, int page) {
    if (q.length() > 100 || page < 0) throw new IllegalArgumentException("Invalid search");
    String key =
        switch (sort) {
          case "calories" -> "calories";
          case "protein" -> "protein";
          default -> "name";
        };
    var result =
        foods.search(
            user,
            q,
            category,
            PageRequest.of(
                page,
                30,
                Sort.by(key.equals("protein") ? Sort.Direction.DESC : Sort.Direction.ASC, key)
                    .and(Sort.by("id"))));
    return Map.of(
        "content",
        result.getContent(),
        "totalElements",
        result.getTotalElements(),
        "totalPages",
        result.getTotalPages(),
        "page",
        result.getNumber());
  }

  public List<String> categories(UUID u) {
    return foods.categories(u);
  }

  @Transactional
  public Food custom(UUID u, CustomFood d) {
    Food f = new Food();
    f.ownerId = u;
    f.name = d.name();
    f.category = d.category();
    f.calories = d.calories();
    f.protein = d.protein();
    f.carbs = d.carbs();
    f.fat = d.fat();
    f.fiber = d.fiber();
    f.sugar = d.sugar();
    f.sodium = d.sodium();
    f.source = "User-entered · not independently verified";
    return foods.save(f);
  }

  public List<Food> favorites(UUID u) {
    return favorites.findByUserId(u).stream().map(f -> accessible(f.foodId, u)).toList();
  }

  @Transactional
  public void toggle(UUID u, Long id) {
    accessible(id, u);
    var existing = favorites.findByUserIdAndFoodId(u, id);
    if (existing.isPresent()) favorites.delete(existing.get());
    else {
      FavoriteFood f = new FavoriteFood();
      f.userId = u;
      f.foodId = id;
      favorites.save(f);
    }
  }
}
