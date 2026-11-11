package com.mediqueue.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.exception.ErrorResponses;
import com.mediqueue.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads "Authorization: Bearer &lt;jwt&gt;", checks signature and expiry, checks that the account
 * still exists and is ACTIVE, then stores an {@link AuthenticatedUser} as the principal.
 *
 * <p>A missing, invalid or expired token leaves the request unauthenticated, so protected endpoints
 * answer 401 through {@link RestAuthenticationEntryPoint}. Because the account is checked on every
 * request, a suspended or deactivated user is locked out immediately, not when the token expires.
 *
 * <p>A user still on a temporary password (created or reset by the administrator) may only read
 * their profile and change the password; every other call answers 403 with code
 * PASSWORD_CHANGE_REQUIRED.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    /** Request attribute carrying the reason a token was rejected, for the 401 message. */
    public static final String AUTH_ERROR_ATTRIBUTE = "mq.authError";

    public static final String PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(
            JwtUtil jwtUtil, UserRepository userRepository, ObjectMapper objectMapper) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            boolean mustChangePassword = authenticate(header.substring(7), request);
            if (mustChangePassword && !allowedBeforePasswordChange(request)) {
                Map<String, Object> body =
                        ErrorResponses.body(
                                HttpStatus.FORBIDDEN,
                                "Please change your temporary password before continuing.",
                                request.getRequestURI());
                body.put("code", PASSWORD_CHANGE_REQUIRED);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getOutputStream(), body);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * @return whether the authenticated user still has to replace a temporary password
     */
    private boolean authenticate(String token, HttpServletRequest request) {
        if (!jwtUtil.validateToken(token)) {
            request.setAttribute(
                    AUTH_ERROR_ATTRIBUTE, "Your session has expired. Please log in again.");
            return false;
        }
        String username = jwtUtil.extractUsername(token);
        var found = userRepository.findByUsername(username);
        if (found.isEmpty()) {
            request.setAttribute(AUTH_ERROR_ATTRIBUTE, "Your account no longer exists.");
            return false;
        }
        var user = found.get();
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            request.setAttribute(
                    AUTH_ERROR_ATTRIBUTE,
                    "Your account is " + AccountStatus.describe(user.getAccountStatus()) + ".");
            return false;
        }
        var principal = new AuthenticatedUser(user.getUserId(), user.getUsername(), user.getRole());
        var auth =
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        SecurityContextHolder.getContext().setAuthentication(auth);
        return user.isMustChangePassword();
    }

    private static boolean allowedBeforePasswordChange(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();
        return path.equals("/api/v1/auth/me/password")
                || (path.equals("/api/v1/auth/me") && "GET".equals(method))
                || path.equals("/api/v1/auth/login")
                || "OPTIONS".equals(method);
    }
}
