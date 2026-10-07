package com.fitplix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FitplixApplication {
  public static void main(String[] args) {
    var context = SpringApplication.run(FitplixApplication.class, args);
    if (context.getEnvironment().getProperty("fitflix.migrate-only", Boolean.class, false)) {
      System.exit(SpringApplication.exit(context));
    }
  }
}
