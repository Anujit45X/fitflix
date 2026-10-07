package com.fitplix.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Explicit browser routes: API requests never fall through to the SPA. */
@Controller
public class SpaController {
  @GetMapping({
    "/",
    "/privacy",
    "/forgot-password",
    "/reset-password",
    "/login",
    "/register",
    "/onboarding",
    "/today",
    "/thali",
    "/workouts",
    "/settings",
    "/diary",
    "/planner",
    "/progress",
    "/goals",
    "/analytics",
    "/product",
    "/profile"
  })
  public String index() {
    return "forward:/index.html";
  }
}
