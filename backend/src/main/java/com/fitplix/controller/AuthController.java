package com.fitplix.controller;

import com.fitplix.dto.AuthDtos.*;
import com.fitplix.service.AuthService;
import com.fitplix.service.VisitorService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
public class AuthController {
  private final AuthService auth;
  private final com.fitplix.service.RecoveryService recovery;
  private final boolean secure;
  private final String origin;
  private final VisitorService visitors;

  public AuthController(
      AuthService a,
      @Value("${fitplix.secure-cookie}") boolean s,
      @Value("${fitplix.allowed-origin}") String o,
      VisitorService v,
      com.fitplix.service.RecoveryService recovery) {
    this.recovery = recovery;
    auth = a;
    secure = s;
    origin = o;
    visitors = v;
  }

  private void cookie(HttpServletResponse r, String token, long age) {
    r.addHeader(
        "Set-Cookie",
        ResponseCookie.from("fitplix_refresh", token)
            .httpOnly(true)
            .secure(secure)
            .sameSite("Strict")
            .path("/api")
            .maxAge(age)
            .build()
            .toString());
    r.setHeader("Cache-Control", "no-store");
  }

  private Object reply(AuthService.Result result, HttpServletResponse r) {
    cookie(r, result.refreshToken(), 30L * 86400);
    return Map.of("accessToken", result.accessToken(), "user", result.user());
  }

  private void origin(String o) {
    if (!origin.equals(o))
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Origin not allowed");
  }

  @PostMapping("/register")
  public Object register(
      @Valid @RequestBody Register d,
      HttpServletResponse r,
      @CookieValue(value = "fitplix_visitor", defaultValue = "") String visitor) {
    var result = auth.register(d);
    visitors.link(visitor, (java.util.UUID) result.user().get("id"));
    return reply(result, r);
  }

  @PostMapping("/login")
  public Object login(@Valid @RequestBody Login d, HttpServletResponse r) {
    return reply(auth.login(d), r);
  }

  @PostMapping("/refresh")
  public Object refresh(
      @CookieValue(value = "fitplix_refresh", defaultValue = "") String raw,
      @RequestHeader(value = "Origin", defaultValue = "") String o,
      HttpServletResponse r) {
    origin(o);
    return reply(auth.refresh(raw), r);
  }

  @PostMapping("/logout")
  public Object logout(
      @CookieValue(value = "fitplix_refresh", defaultValue = "") String raw,
      @RequestHeader(value = "Origin", defaultValue = "") String o,
      HttpServletResponse r) {
    origin(o);
    auth.logout(raw);
    cookie(r, "", 0);
    return Map.of("message", "Signed out");
  }

  @PostMapping("/forgot-password")
  public Object forgot(@Valid @RequestBody Forgot d) {
    recovery.request(d.email());
    return Map.of(
        "message",
        "If an account exists, a reset link will be sent shortly. Check your inbox and spam"
            + " folder.");
  }

  @PostMapping("/reset-password")
  public Object reset(@Valid @RequestBody Reset d, HttpServletResponse r) {
    recovery.reset(d.token(), d.password());
    cookie(r, "", 0);
    return Map.of("message", "Password updated. Sign in with your new password.");
  }

  @PostMapping("/visit")
  public Object visit(
      @CookieValue(value = "fitplix_visitor", defaultValue = "") String raw,
      HttpServletResponse r) {
    var id = visitors.visit(raw);
    r.addHeader(
        "Set-Cookie",
        ResponseCookie.from("fitplix_visitor", id.toString())
            .httpOnly(true)
            .secure(secure)
            .sameSite("Strict")
            .path("/api")
            .maxAge(31536000)
            .build()
            .toString());
    return Map.of("ok", true);
  }
}
