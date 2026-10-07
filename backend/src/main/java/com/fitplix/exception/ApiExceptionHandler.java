package com.fitplix.exception;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> invalid(MethodArgumentNotValidException e) {
    Map<String, String> fields = new LinkedHashMap<>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f -> fields.put(f.getField(), f.getDefaultMessage()));
    return ResponseEntity.badRequest()
        .body(Map.of("message", "Check the highlighted fields", "fields", fields));
  }

  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  ResponseEntity<?> bad(RuntimeException e) {
    return ResponseEntity.badRequest()
        .body(Map.of("message", Objects.toString(e.getMessage(), "Invalid request")));
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode())
        .body(Map.of("message", Objects.toString(e.getReason(), "Request failed")));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict(Exception e) {
    return ResponseEntity.status(409)
        .body(Map.of("message", "This record conflicts with existing data"));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e) {
    org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class)
        .error("Unexpected API failure: {}", e.getClass().getSimpleName());
    return ResponseEntity.status(500)
        .body(Map.of("message", "The request could not be completed. Please try again."));
  }

  @ExceptionHandler({
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
    org.springframework.web.bind.MissingServletRequestParameterException.class
  })
  ResponseEntity<?> malformed(Exception e) {
    return ResponseEntity.badRequest()
        .body(Map.of("message", "Invalid request format or missing required parameter"));
  }
}
