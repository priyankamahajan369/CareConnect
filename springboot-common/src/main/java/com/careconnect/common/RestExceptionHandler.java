package com.careconnect.common;

import java.util.NoSuchElementException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class RestExceptionHandler {
  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<ProblemDetail> invalid(IllegalArgumentException e) {
    return problem(400, e.getMessage());
  }

  @ExceptionHandler(NoSuchElementException.class)
  ResponseEntity<ProblemDetail> missing(NoSuchElementException e) {
    return problem(404, e.getMessage());
  }

  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<ProblemDetail> conflict(IllegalStateException e) {
    return problem(409, e.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> validation(MethodArgumentNotValidException e) {
    return problem(
        400,
        e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("Invalid request"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ProblemDetail> duplicate(DataIntegrityViolationException e) {
    return problem(409, "Record conflicts with an existing value or booked slot");
  }

  @ExceptionHandler(org.springframework.web.client.HttpClientErrorException.class)
  ResponseEntity<ProblemDetail> downstreamClient(
      org.springframework.web.client.HttpClientErrorException e) {
    return problem(
        e.getStatusCode().value(),
        "Patient lookup was not authorized or the record was unavailable");
  }

  @ExceptionHandler(org.springframework.web.client.RestClientException.class)
  ResponseEntity<ProblemDetail> downstreamUnavailable(
      org.springframework.web.client.RestClientException e) {
    return problem(503, "An upstream service is unavailable. Please try again later.");
  }

  @ExceptionHandler(org.springframework.dao.OptimisticLockingFailureException.class)
  ResponseEntity<ProblemDetail> staleWrite(
      org.springframework.dao.OptimisticLockingFailureException e) {
    return problem(409, "This record changed. Refresh before trying again.");
  }

  private ResponseEntity<ProblemDetail> problem(int status, String message) {
    return ResponseEntity.status(status)
        .body(ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(status), message));
  }
}
