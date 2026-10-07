package com.fitplix.dto;

import jakarta.validation.constraints.*;

public final class AuthDtos {
  public record Register(
      @NotBlank @Size(max = 80) String name,
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 12, max = 72) String password) {}

  public record Login(@NotBlank @Email String email, @NotBlank @Size(max = 72) String password) {}

  public record Forgot(@NotBlank @Email @Size(max = 254) String email) {}

  public record Reset(
      @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{64}") String token,
      @NotBlank @Size(min = 12, max = 72) String password) {}
}
