package com.mediqueue.security;

import java.security.SecureRandom;

/**
 * Random one-time passwords for accounts created or reset by the administrator. 12 characters
 * with at least one upper-case letter, lower-case letter, digit and symbol; look-alike
 * characters (0/O, 1/l/I) are left out so it can be read out or copied by hand.
 */
public final class TemporaryPasswords {

    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "@#$%&*!?";
    private static final String ALL = UPPER + LOWER + DIGITS + SYMBOLS;
    public static final int LENGTH = 12;

    private static final SecureRandom RANDOM = new SecureRandom();

    private TemporaryPasswords() {}

    public static String generate() {
        char[] chars = new char[LENGTH];
        chars[0] = pick(UPPER);
        chars[1] = pick(LOWER);
        chars[2] = pick(DIGITS);
        chars[3] = pick(SYMBOLS);
        for (int i = 4; i < LENGTH; i++) chars[i] = pick(ALL);
        // shuffle so the guaranteed characters are not always at the front
        for (int i = LENGTH - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char t = chars[i]; chars[i] = chars[j]; chars[j] = t;
        }
        return new String(chars);
    }

    private static char pick(String from) {
        return from.charAt(RANDOM.nextInt(from.length()));
    }
}
