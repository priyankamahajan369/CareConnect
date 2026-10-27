package com.careconnect.common;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class LoggingCorrelationFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain chain)
      throws ServletException, IOException {
    String supplied = r.getHeader("X-Correlation-ID");
    String id =
        supplied != null && supplied.matches("[a-zA-Z0-9-]{1,64}")
            ? supplied
            : UUID.randomUUID().toString();
    MDC.put("correlationId", id);
    s.setHeader("X-Correlation-ID", id);
    try {
      chain.doFilter(r, s);
    } finally {
      MDC.remove("correlationId");
    }
  }
}
