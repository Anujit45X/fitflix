package com.fitplix.service;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ExperimentService {
  private final JdbcTemplate jdbc;

  public ExperimentService(JdbcTemplate j) {
    jdbc = j;
  }

  public String assign(UUID u) {
    String variant = Math.floorMod(u.hashCode(), 2) == 0 ? "A" : "B";
    jdbc.update(
        "insert into experiment_assignment(id,user_id,experiment_id,variant) values"
            + " (?,?,'onboarding-insight-v1',?) on conflict(user_id,experiment_id) do nothing",
        UUID.randomUUID(),
        u,
        variant);
    return variant;
  }

  public String variant(UUID u) {
    var values =
        jdbc.queryForList(
            "select variant from experiment_assignment where user_id=? and"
                + " experiment_id='onboarding-insight-v1'",
            String.class,
            u);
    return values.isEmpty() ? "A" : values.get(0);
  }
}
