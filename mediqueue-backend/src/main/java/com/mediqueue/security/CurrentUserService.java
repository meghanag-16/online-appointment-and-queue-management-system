package com.mediqueue.security;

import com.mediqueue.entity.User;
import com.mediqueue.exception.UnauthorizedException;
import com.mediqueue.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/** Returns the logged-in user from the security context (populated by {@link JwtAuthFilter}). */
@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthenticatedUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser user) {
            return user;
        }
        throw new UnauthorizedException("You are not logged in");
    }

    public String userId() {
        return get().userId();
    }

    /** Loads the full entity for the logged-in user. */
    public User entity() {
        return userRepository
                .findById(userId())
                .orElseThrow(() -> new UnauthorizedException("Your account no longer exists"));
    }
}
