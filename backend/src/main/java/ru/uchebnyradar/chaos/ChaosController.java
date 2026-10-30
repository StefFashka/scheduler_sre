package ru.uchebnyradar.chaos;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.uchebnyradar.security.CurrentUser;
import ru.uchebnyradar.security.CustomUserDetails;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;

@RestController
@RequestMapping("/api/chaos")
@Tag(name = "Chaos", description = "Managing of chaos testing endpoints")
@ConditionalOnProperty(name = "app.chaos.enabled", havingValue = "true", matchIfMissing = true)
public class ChaosController {

    private final ChaosService chaosService;
    public ChaosController(ChaosService chaosService) {
        this.chaosService = chaosService;
    }

    @GetMapping("/status")
    @Operation(summary = "Get chaos status", description = "Returns the current status of chaos testing (enabled or disabled)")
    public ResponseEntity<Boolean> getChaosStatus() {
        boolean status = chaosService.getStatus();
        return ResponseEntity.ok(status);
    }

    @PostMapping("/enable")
    @Operation(summary = "Enable chaos testing", description = "Enables chaos testing for the application")
    public ResponseEntity<Void> enableChaos() {
        chaosService.enable();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disable")
    @Operation(summary = "Disable chaos testing", description = "Disables chaos testing for the application")
    public ResponseEntity<Void> disableChaos() {
        chaosService.disable();
        return ResponseEntity.ok().build();
    }
}