package ru.uchebnyradar.security;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication and CSRF management")
public class CsrfController {

    @GetMapping("/csrf")
    @Operation(summary = "Get CSRF token", description = "Returns the CSRF token to be included in the X-CSRF-TOKEN header on state-changing requests")
    public ResponseEntity<CsrfResponse> getCsrf(CsrfToken token) {
        if (token == null) {
            return ResponseEntity.ok(new CsrfResponse("", "X-CSRF-TOKEN", "_csrf"));
        }
        return ResponseEntity.ok(new CsrfResponse(token.getToken(), token.getHeaderName(), token.getParameterName()));
    }
}
