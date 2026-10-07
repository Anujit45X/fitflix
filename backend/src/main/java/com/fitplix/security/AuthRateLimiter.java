package com.fitplix.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Single-node guard; configure distributed edge limits before multi-node launch. */
@Component
public class AuthRateLimiter extends OncePerRequestFilter {
  private record Window(long start, int count) {}

  @org.springframework.beans.factory.annotation.Value("${fitplix.trust-proxy:false}")
  private boolean trustProxy;

  private final ConcurrentHashMap<String, Window> counters = new ConcurrentHashMap<>();

  protected void doFilterInternal(HttpServletRequest q, HttpServletResponse r, FilterChain c)
      throws ServletException, IOException {
    if ((q.getRequestURI().startsWith("/api/auth/")
            || q.getRequestURI().startsWith("/api/v1/auth/"))
        && q.getMethod().equals("POST")) {
      long now = System.currentTimeMillis();
      counters.entrySet().removeIf(e -> now - e.getValue().start > 60000);
      Window w =
          counters.compute(
              trustProxy && q.getHeader("X-Real-IP") != null
                  ? q.getHeader("X-Real-IP")
                  : q.getRemoteAddr(),
              (k, v) ->
                  v == null || now - v.start > 60000
                      ? new Window(now, 1)
                      : new Window(v.start, v.count + 1));
      if (w.count > 30) {
        r.setStatus(429);
        r.setHeader("Retry-After", "60");
        r.setContentType("application/json");
        r.getWriter().write("{\"message\":\"Too many attempts. Try again in a minute.\"}");
        return;
      }
    }
    c.doFilter(q, r);
  }
}
