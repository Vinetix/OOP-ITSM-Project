package com.itsm.user.dto;

/**
 * Single source of truth for input rules shared by several request DTOs
 * (and mirrored by the frontend), so every endpoint validates the same way.
 */
public final class ValidationRules {

    private ValidationRules() {
    }

    // ---------- Email ----------
    /**
     * Stricter than Jakarta's @Email (which accepts "a@b"):
     * - local part: letters, digits, _ % + - ; dots only between characters (no leading/trailing/double dots)
     * - domain: one or more labels that don't start/end with "-", then a letters-only TLD of 2+ chars
     */
    public static final String EMAIL_PATTERN =
            "^[A-Za-z0-9_%+-]+(\\.[A-Za-z0-9_%+-]+)*@([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,}$";
    public static final String EMAIL_MESSAGE = "Enter a valid email address, like name@itsm.com";
    public static final int EMAIL_MAX_LENGTH = 150;

    // ---------- Password ----------
    /** At least one letter and one digit. Length is checked separately with @Size. */
    public static final String PASSWORD_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d).+$";
    public static final String PASSWORD_MESSAGE = "must contain at least one letter and one digit";
    public static final int PASSWORD_MIN_LENGTH = 8;
    /** BCrypt only uses the first 72 bytes of a password. */
    public static final int PASSWORD_MAX_LENGTH = 72;

    // ---------- Phone ----------
    public static final String PHONE_PATTERN = "^[0-9+\\-() ]{7,20}$";
    public static final String PHONE_MESSAGE = "must be 7-20 digits (may include + - ( ) and spaces)";
}
