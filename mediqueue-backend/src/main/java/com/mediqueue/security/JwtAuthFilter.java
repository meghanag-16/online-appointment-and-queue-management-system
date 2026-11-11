package com.mediqueue.security;

import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads "Authorization: Bearer &lt;jwt&gt;", checks signature and expiry, checks that the account
 * still exists and is ACTIVE, then stores an {@link AuthenticatedUser} as the principal.
 *
 * A missing, invalid or expired token leaves the request unauthenticated, so protected endpoints
 * answer 401 through {@link RestAuthenticationEntryPoint}. Because the account is checked on every
 * request, a suspended or deactivated user is locked out immediately, not when the token expires.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    /** Request attribute carrying the reason a token was rejected, for the 401 message. */
    public static final String AUTH_ERROR_ATTRIBUTE = "mq.authError";

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            authenticate(header.substring(7), request);
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, HttpServletRequest request) {
        if (!jwtUtil.validateToken(token)) {
            request.setAttribute(AUTH_ERROR_ATTRIBUTE, "Your session has expired. Please log in again.");
            return;
        }
        String username = jwtUtil.extractUsername(token);
        userRepository.findByUsername(username).ifPresentOrElse(user -> {
            if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                request.setAttribute(AUTH_ERROR_ATTRIBUTE,
                    "Your account is " + AccountStatus.describe(user.getAccountStatus()) + ".");
                return;
            }
            var principal = new AuthenticatedUser(user.getUserId(), user.getUsername(), user.getRole());
            var auth = new UsernamePasswordAuthenticationToken(
                principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }, () -> request.setAttribute(AUTH_ERROR_ATTRIBUTE, "Your account no longer exists."));
    }
}
