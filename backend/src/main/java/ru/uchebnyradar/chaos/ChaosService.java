package ru.uchebnyradar.chaos;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.auth.UserRepository;
import ru.uchebnyradar.common.ResourceNotFoundException;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;

@Service
@ConditionalOnProperty(name = "app.chaos.enabled", havingValue = "true", matchIfMissing = true)
public class ChaosService {
    private AtomicBoolean enabled = new AtomicBoolean(false);
    double failureRate = 0.2;
    long latencyMs = 1500;

    public ChaosService() {}

    public void enable() {
        enabled.set(true);
    }

    public void disable() {
        enabled.set(false);
    }

    public boolean getStatus() {
        return enabled.get();
    }

    public double getFailureRate() {
        return failureRate;
    }

    public long getLatencyMs() {
        return latencyMs;
    }

}