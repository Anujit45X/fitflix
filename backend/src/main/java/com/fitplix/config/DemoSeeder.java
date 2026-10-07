package com.fitplix.config;

import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "fitplix.demo", havingValue = "true")
public class DemoSeeder implements CommandLineRunner {
  private final JdbcTemplate jdbc;
  private final PasswordEncoder passwords;
  private final String password;

  public DemoSeeder(JdbcTemplate j, PasswordEncoder p, @Value("${DEMO_PASSWORD:}") String pw) {
    jdbc = j;
    passwords = p;
    password = pw;
  }

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    if (password.length() < 12)
      throw new IllegalStateException(
          "DEMO_PASSWORD must contain at least 12 characters when demo mode is enabled");
    if (jdbc.queryForObject("select count(*) from app_user where demo=true", Integer.class) > 0)
      return;
    String sql = new ClassPathResource("demo.sql").getContentAsString(StandardCharsets.UTF_8);
    jdbc.execute(sql);
    jdbc.update("update app_user set password_hash=? where demo=true", passwords.encode(password));
  }
}
