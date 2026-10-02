package ru.uchebnyradar.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Учебный радар API")
                        .description("REST API веб-приложения «Учебный радар» для планирования учебных проектов и контроля сроков")
                        .version("1.0.0")
                        .contact(new Contact().name("Учебный радар Team")))
                .addSecurityItem(new SecurityRequirement().addList("SessionCookie"))
                .components(new Components()
                        .addSecuritySchemes("SessionCookie", new SecurityScheme()
                                .name("SESSION")
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .description("HTTP session cookie issued upon login")));
    }
}
