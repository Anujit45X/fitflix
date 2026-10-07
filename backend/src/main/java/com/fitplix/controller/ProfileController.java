package com.fitplix.controller;

import com.fitplix.dto.ProfileRequest;
import com.fitplix.repository.*;
import com.fitplix.service.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api", "/api/v1"})
public class ProfileController {
  private final ProfileService profiles;
  private final ProfileRepository repo;
  private final UserRepository users;
  private final AuthService auth;
  private final ExperimentService experiments;

  public ProfileController(
      ProfileService p, ProfileRepository r, UserRepository u, AuthService a, ExperimentService x) {
    experiments = x;
    profiles = p;
    repo = r;
    users = u;
    auth = a;
  }

  @GetMapping("/me")
  public Object me(Authentication a) {
    UUID id = (UUID) a.getPrincipal();
    var result = new HashMap<String, Object>();
    result.put("variant", experiments.variant(id));
    result.put("user", auth.view(users.findById(id).orElseThrow()));
    result.put("profile", repo.findById(id).orElse(null));
    return result;
  }

  @GetMapping("/profile")
  public Object get(Authentication a) {
    return profiles.require((UUID) a.getPrincipal());
  }

  @PutMapping("/profile")
  public Object put(Authentication a, @Valid @RequestBody ProfileRequest d) {
    return profiles.save((UUID) a.getPrincipal(), d);
  }
}
