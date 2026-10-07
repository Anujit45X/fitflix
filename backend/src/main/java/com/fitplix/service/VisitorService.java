package com.fitplix.service;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class VisitorService {
  private final JdbcTemplate jdbc;

  public VisitorService(JdbcTemplate j) {
    jdbc = j;
  }

  public UUID visit(String raw) {
    try {
      UUID id = UUID.fromString(raw);
      if (jdbc.queryForObject("select count(*) from visitor where id=?", Integer.class, id) > 0)
        return id;
    } catch (Exception ignored) {
    }
    UUID id = UUID.randomUUID();
    jdbc.update("insert into visitor(id) values (?)", id);
    return id;
  }

  public void link(String raw, UUID user) {
    try {
      UUID id = UUID.fromString(raw);
      jdbc.update("update visitor set user_id=? where id=? and user_id is null", user, id);
    } catch (IllegalArgumentException ignored) {
    }
  }
}
