package com.fitplix.security;

import com.fitplix.repository.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {
  private final TokenService tokens;
  private final SessionRepository sessions;
  private final UserRepository users;

  public JwtFilter(TokenService t, SessionRepository s, UserRepository u) {
    tokens = t;
    sessions = s;
    users = u;
  }

  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      try {
        var c = tokens.verify(h.substring(7));
        UUID id = UUID.fromString(c.getSubject());
        var s = sessions.findById(UUID.fromString(c.getStringClaim("sid"))).orElseThrow();
        if (s.revoked || s.expiresAt.isBefore(java.time.Instant.now()) || !s.userId.equals(id))
          throw new Exception();
        var u = users.findById(id).orElseThrow();
        SecurityContextHolder.getContext()
            .setAuthentication(
                new UsernamePasswordAuthenticationToken(
                    id, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.role))));
      } catch (Exception e) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(req, res);
  }
}
