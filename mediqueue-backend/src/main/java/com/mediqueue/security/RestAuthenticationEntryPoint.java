package com.mediqueue.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediqueue.exception.ErrorResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 401 for requests with no valid login (missing, expired or invalid token). Spring Security's
 * default here was 403, which the frontend could not tell apart from "not allowed", so expired
 * sessions never redirected to the login page.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        Object reason = request.getAttribute(JwtAuthFilter.AUTH_ERROR_ATTRIBUTE);
        String message = reason != null ? reason.toString() : "Authentication required. Please log in.";
        ErrorResponses.write(response, objectMapper, HttpStatus.UNAUTHORIZED, message, request.getRequestURI());
    }
}
