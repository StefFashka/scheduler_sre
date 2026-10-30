package ru.uchebnyradar.chaos;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1) 
@ConditionalOnProperty(name = "app.chaos.enabled", havingValue = "true", matchIfMissing = true)
public class ChaosFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ChaosFilter.class);
    private final ChaosService chaosService;

    public ChaosFilter(ChaosService chaosService) {
        this.chaosService = chaosService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!chaosService.getStatus()) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        if (path.startsWith("/api/chaos") || path.startsWith("/actuator") || path.equals("/api/auth/csrf")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/api/")) {
            double roll = ThreadLocalRandom.current().nextDouble();

            if (roll < chaosService.getFailureRate()) {
                log.warn("ChaosFilter: Ingecting 500 in query {}", path);
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":500,\"error\":\"Chaos Error\",\"message\":\"Injected by ChaosFilter\"}");
                return; 
            }

            if (roll < (chaosService.getFailureRate() + 0.4)) {
                log.warn("ChaosFilter: Injecting latency {} ms in query {}", chaosService.getLatencyMs(), path);
                try {
                    Thread.sleep(chaosService.getLatencyMs());
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
