# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build stage using Maven and Eclipse Temurin JDK 21 (Alpine)
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy project dependency descriptor first for optimal Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy application sources and build package
COPY src ./src
RUN mvn clean package -DskipTests -B

# Extract layered jar layers for fine-grained image layer caching (Spring Boot 3.3)
RUN java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination /build/extracted

# ==============================================================================
# Stage 2: Minimal runtime stage using Eclipse Temurin JRE 21 (Alpine)
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create unprivileged dedicated system group and user (Non-root user)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy layers from least frequently changed to most frequently changed
COPY --from=builder /build/extracted/dependencies/ ./
COPY --from=builder /build/extracted/spring-boot-loader/ ./
COPY --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --from=builder /build/extracted/application/ ./

# Enforce least-privilege ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root execution context
USER appuser:appgroup

# Default application port
EXPOSE 8080

# Configure container-aware JVM memory settings and graceful termination
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Graceful SIGTERM propagation: exec replaces shell process ensuring Java is PID 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
