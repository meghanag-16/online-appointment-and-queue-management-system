package com.mediqueue.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** One JSON error shape for the whole API: {timestamp, status, error, path, fieldErrors?}. */
public final class ErrorResponses {

    private ErrorResponses() {}

    public static Map<String, Object> body(HttpStatus status, String message, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", message != null ? message : status.getReasonPhrase());
        if (path != null) body.put("path", path);
        return body;
    }

    /** Used by the security filter chain, which runs before controllers and @RestControllerAdvice. */
    public static void write(HttpServletResponse response, ObjectMapper mapper,
                             HttpStatus status, String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), body(status, message, path));
    }
}
