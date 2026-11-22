package ru.uchebnyradar.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class PodInfoFilter extends OncePerRequestFilter {

    @Value("${app.version:v1.0.0}")
    private String version;

    @Value("${HOSTNAME:local-pod}")
    private String podName;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        response.setHeader("X-Pod-Name", podName);
        response.setHeader("X-App-Version", version);
        filterChain.doFilter(request, response);
    }
}