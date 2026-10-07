package com.fitplix.controller;

import com.fitplix.analytics.ProductAnalyticsService;
import java.time.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class ProductController {
  private final ProductAnalyticsService product;

  public ProductController(ProductAnalyticsService p) {
    product = p;
  }

  @GetMapping({
    "/product-metrics",
    "/funnel",
    "/retention",
    "/feature-adoption",
    "/users",
    "/experiments"
  })
  public Object metrics(
      @RequestParam(defaultValue = "false") boolean demo,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to) {
    if (to == null) to = LocalDate.now(ZoneOffset.UTC);
    if (from == null) from = to.minusDays(29);
    return product.report(demo, from, to);
  }
}
