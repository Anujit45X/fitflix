package com.fitplix.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Origin guard on browser auth writes, including login CSRF. Non-browser clients without Origin may
 * register/login, but refresh/logout independently REQUIRE the configured Origin.
 */
@Component
public class AuthOriginFilter extends OncePerRequestFilter {
  @Value("${fitplix.allowed-origin}")
  private String origin;

  protected void doFilterInternal(HttpServletRequest q, HttpServletResponse r, FilterChain chain)
      throws ServletException, IOException {
    String path = q.getRequestURI();
    if (q.getMethod().equals("POST")
        && (path.startsWith("/api/auth/") || path.startsWith("/api/v1/auth/"))
        && q.getHeader("Origin") != null
        && !origin.equals(q.getHeader("Origin"))) {
      r.setStatus(403);
      r.setContentType("application/json");
      r.getWriter().write("{\"message\":\"Origin not allowed\"}");
      return;
    }
    chain.doFilter(q, r);
  }
}
