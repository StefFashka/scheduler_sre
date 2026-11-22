package ru.uchebnyradar.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class VersionController {

    @Value("${app.version:v1.0.0}")
    private String version;

    @Value("${HOSTNAME:local-pod}")
    private String podName;

    @GetMapping(value = "/", produces = MediaType.TEXT_PLAIN_VALUE)
    public String getTrafficInfo() {
        return String.format("Host: %s, Version: %s", podName, version);
    }

    @GetMapping("/api/version")
    public Map<String, String> getVersionJson() {
        return Map.of(
            "pod", podName,
            "version", version
        );
    }
}