package com.mediqueue.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Browser origins allowed to call the API, from app.cors.allowed-origins
 * (APP_CORS_ALLOWED_ORIGINS), a comma-separated list. The defaults cover local development; set the
 * real site address when deploying.
 */
@Configuration
public class CorsConfig {

    @Value(
            "${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:80,http://localhost}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        List<String> origins =
                Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(origins); // patterns allow e.g. https://*.onrender.com
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
