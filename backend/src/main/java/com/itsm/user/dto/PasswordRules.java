package com.itsm.user.dto;

/** One definition of "strong password", reused by every request that sets a password. */
public final class PasswordRules {

    private PasswordRules() {
    }

    /** At least one letter and one digit. Length is checked separately with @Size. */
    public static final String PATTERN = "^(?=.*[A-Za-z])(?=.*\\d).+$";
    public static final String MESSAGE = "must contain at least one letter and one digit";
    public static final int MIN_LENGTH = 8;
    /** BCrypt only uses the first 72 bytes of a password. */
    public static final int MAX_LENGTH = 72;

    public static final String PHONE_PATTERN = "^[0-9+\\-() ]{7,20}$";
    public static final String PHONE_MESSAGE = "must be 7-20 digits (may include + - ( ) and spaces)";
}
