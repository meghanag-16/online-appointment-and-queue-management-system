package com.mediqueue.controller;

import java.util.Map;
import javax.sql.DataSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public health check for the hosting platform and the post-deploy smoke test: 200 when the API and
 * its database answer, 503 when the database does not.
 */
@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/v1/health")
    public ResponseEntity<Map<String, String>> health() {
        boolean databaseUp;
        try (var connection = dataSource.getConnection()) {
            databaseUp = connection.isValid(2);
        } catch (Exception e) {
            databaseUp = false;
        }
        return ResponseEntity.status(databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(
                        Map.of(
                                "status",
                                databaseUp ? "UP" : "DOWN",
                                "database",
                                databaseUp ? "UP" : "DOWN"));
    }
}
