package com.mediqueue.admin;

import static com.mediqueue.entity.enums.ResolutionStatus.*;
import static org.junit.jupiter.api.Assertions.*;

import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.security.TemporaryPasswords;
import com.mediqueue.service.impl.ComplaintServiceImpl;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

/** Complaint lifecycle and temporary passwords. */
class AdminRulesTest {

    @Test
    void complaintsMoveOpenThenUnderReviewThenResolved() {
        assertTrue(ComplaintServiceImpl.canMove(OPEN, UNDER_REVIEW));
        assertTrue(ComplaintServiceImpl.canMove(UNDER_REVIEW, RESOLVED));
    }

    @Test
    void complaintsCannotSkipReviewGoBackOrReopen() {
        assertFalse(ComplaintServiceImpl.canMove(OPEN, RESOLVED));
        assertFalse(ComplaintServiceImpl.canMove(UNDER_REVIEW, OPEN));
        for (ResolutionStatus to : ResolutionStatus.values()) {
            assertFalse(ComplaintServiceImpl.canMove(RESOLVED, to));
        }
    }

    @RepeatedTest(20)
    void temporaryPasswordsMixAllCharacterKinds() {
        String p = TemporaryPasswords.generate();
        assertEquals(TemporaryPasswords.LENGTH, p.length());
        assertTrue(p.chars().anyMatch(Character::isUpperCase));
        assertTrue(p.chars().anyMatch(Character::isLowerCase));
        assertTrue(p.chars().anyMatch(Character::isDigit));
        assertTrue(p.chars().anyMatch(c -> "@#$%&*!?".indexOf(c) >= 0));
        assertTrue(
                p.chars().noneMatch(c -> "0O1lI".indexOf(c) >= 0),
                "look-alike characters left out");
    }

    @Test
    void temporaryPasswordsAreNotRepeated() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 200; i++) assertTrue(seen.add(TemporaryPasswords.generate()));
    }
}
