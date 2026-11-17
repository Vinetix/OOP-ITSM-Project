package com.itsm.intelligence.ai;

import java.util.List;
import java.util.Optional;

/**
 * Adapter target: "ask an AI model which category fits this incident". The rest of the application only
 * knows this interface, never a vendor SDK or URL. Implementations: GeminiCategoryClient (Google Gemini)
 * and DisabledAiCategoryClient (when no API key is configured). A Claude or OpenAI adapter would be one
 * more class.
 *
 * Implementations may throw any RuntimeException on network errors, timeouts or bad answers; the caller
 * (CategorySuggestionService) catches it and falls back to keyword matching.
 */
public interface AiCategoryClient {

    /** e.g. "GEMINI"; null when disabled. */
    String provider();

    boolean isEnabled();

    /** The chosen category (one of the given codes) and a short reason, or empty if the model gave no usable answer. */
    Optional<AiCategoryChoice> chooseCategory(String title, String description, List<CategoryOption> options);
}
