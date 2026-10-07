package com.fitplix.config;

import com.fitplix.security.JwtFilter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  SecurityFilterChain security(
      HttpSecurity http, JwtFilter jwt, @Value("${fitplix.allowed-origin}") String origin)
      throws Exception {
    var cors = new CorsConfiguration();
    cors.setAllowedOrigins(List.of(origin));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("Content-Type", "Authorization"));
    cors.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return http.cors(c -> c.configurationSource(source))
        .csrf(c -> c.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .headers(
            h ->
                h.contentSecurityPolicy(
                    c ->
                        c.policyDirectives(
                            "default-src 'self'; script-src 'self'; style-src 'self'"
                                + " 'unsafe-inline'; img-src 'self' data:; object-src 'none';"
                                + " base-uri 'self'; frame-ancestors 'none'")))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        org.springframework.http.HttpMethod.GET,
                        "/",
                        "/index.html",
                        "/assets/**",
                        "/favicon.svg",
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
                        "/profile")
                    .permitAll()
                    .requestMatchers(
                        "/api/auth/**",
                        "/api/v1/auth/**",
                        "/actuator/health",
                        "/actuator/health/**")
                    .permitAll()
                    .requestMatchers(
                        "/api/admin/**",
                        "/api/v1/admin/**",
                        "/api/docs/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**")
                    .hasAnyRole("ADMIN", "PRODUCT_MANAGER")
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (q, r, x) -> {
                          r.setStatus(401);
                          r.setContentType("application/json");
                          r.getWriter().write("{\"message\":\"Please sign in\"}");
                        })
                    .accessDeniedHandler(
                        (q, r, x) -> {
                          r.setStatus(403);
                          r.setContentType("application/json");
                          r.getWriter().write("{\"message\":\"Access denied\"}");
                        }))
        .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
        .build();
  }
}
