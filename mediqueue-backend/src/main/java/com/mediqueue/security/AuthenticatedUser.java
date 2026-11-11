package com.mediqueue.security;

import com.mediqueue.entity.enums.UserRole;

/**
 * The logged-in user, built from the JWT and the users table on every request. This is the security
 * principal: controllers and services take identity from here, never from IDs sent in request
 * bodies or URLs.
 */
public record AuthenticatedUser(String userId, String username, UserRole role) {

    public boolean is(UserRole r) {
        return role == r;
    }

    /** Front-desk and admin staff, who may act on any patient's behalf. */
    public boolean isStaff() {
        return role == UserRole.RECEPTIONIST || role == UserRole.ADMINISTRATOR;
    }
}
