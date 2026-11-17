package com.itsm.intelligence;

import com.itsm.catalog.Category;
import com.itsm.catalog.CategoryRepository;
import com.itsm.intelligence.ai.AiCategoryChoice;
import com.itsm.intelligence.ai.AiCategoryClient;
import com.itsm.intelligence.ai.CategoryOption;
import com.itsm.intelligence.dto.AiStatusResponse;
import com.itsm.intelligence.dto.CategorySuggestionResponse;
import com.itsm.intelligence.dto.SuggestionSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Category suggestion with AI first and keywords as the safety net.
 *
 *   AI available → [AI pick (with reason)] + up to 2 keyword suggestions for other categories
 *   otherwise    → the keyword suggestions only (exactly as before Phase 9)
 *
 * The AI is never allowed to break the report form: any error, timeout, unknown category or empty answer
 * silently falls back to keywords. After a failure (e.g. the free tier's rate limit), the AI is paused for a
 * minute. Answers are cached by text, so a user pausing several times on the same text costs one call.
 */
@Slf4j
@Service
public class CategorySuggestionService {

    static final int MIN_TITLE_LENGTH = 5;
    static final int MAX_KEYWORD_EXTRAS = 2;
    static final Duration PAUSE_AFTER_FAILURE = Duration.ofSeconds(60);
    /** "Model busy" (503) passes quickly, so the AI is tried again sooner. */
    static final Duration PAUSE_AFTER_BUSY = Duration.ofSeconds(15);
    static final int MAX_CACHE_ENTRIES = 500;

    private final CategorySuggester keywordSuggester;
    private final CategoryRepository categoryRepository;
    private final AiCategoryClient aiClient;
    private final Clock clock;

    private final Map<String, Optional<AiCategoryChoice>> cache = new ConcurrentHashMap<>();
    private volatile Instant aiPausedUntil = Instant.EPOCH;

    public CategorySuggestionService(CategorySuggester keywordSuggester, CategoryRepository categoryRepository,
                                     AiCategoryClient aiClient, Clock clock) {
        this.keywordSuggester = keywordSuggester;
        this.categoryRepository = categoryRepository;
        this.aiClient = aiClient;
        this.clock = clock;
    }

    public List<CategorySuggestionResponse> suggest(String title, String description) {
        List<CategorySuggestionResponse> keywords = keywordSuggester.suggest(title, description);
        if (!aiClient.isEnabled() || title == null || title.strip().length() < MIN_TITLE_LENGTH) {
            return keywords;
        }
        List<Category> categories = categoryRepository.findAll().stream()
                .filter(Category::isActive)
                .sorted(Comparator.comparing(Category::getCode))
                .toList();
        Optional<AiCategoryChoice> choice = askAi(title, description, categories);
        if (choice.isEmpty()) {
            return keywords;
        }
        Category chosen = categories.stream().filter(c -> c.getCode().equals(choice.get().code())).findFirst().orElse(null);
        if (chosen == null) {
            return keywords;
        }
        CategorySuggestionResponse keywordMatch = keywords.stream()
                .filter(k -> k.code().equals(chosen.getCode())).findFirst().orElse(null);
        List<CategorySuggestionResponse> result = new ArrayList<>();
        result.add(new CategorySuggestionResponse(chosen.getId(), chosen.getCode(), chosen.getName(),
                keywordMatch == null ? 0 : keywordMatch.matchCount(),
                keywordMatch == null ? List.of() : keywordMatch.matchedKeywords(),
                SuggestionSource.AI, choice.get().reason()));
        keywords.stream()
                .filter(k -> !k.code().equals(chosen.getCode()))
                .limit(MAX_KEYWORD_EXTRAS)
                .forEach(result::add);
        return result;
    }

    static boolean isBusy(RuntimeException e) {
        String message = String.valueOf(e.getMessage());
        return message.startsWith("503") || message.contains("UNAVAILABLE");
    }

    public AiStatusResponse status() {
        return new AiStatusResponse(aiClient.isEnabled(), aiClient.isEnabled() ? aiClient.provider() : null);
    }

    private Optional<AiCategoryChoice> askAi(String title, String description, List<Category> categories) {
        String key = (title.strip() + "\n" + (description == null ? "" : description.strip())).toLowerCase(Locale.ROOT);
        Optional<AiCategoryChoice> cached = cache.get(key);
        if (cached != null) {
            return cached;
        }
        if (clock.instant().isBefore(aiPausedUntil)) {
            return Optional.empty();
        }
        List<CategoryOption> options = categories.stream()
                .map(c -> new CategoryOption(c.getCode(), c.getName(), c.getDescription(),
                        c.getKeywords().stream().sorted().toList()))
                .toList();
        try {
            Optional<AiCategoryChoice> answer = aiClient.chooseCategory(title, description, options);
            if (cache.size() >= MAX_CACHE_ENTRIES) {
                cache.clear();
            }
            cache.put(key, answer);
            if (answer.isEmpty()) {
                log.info("AI gave no usable category; using keywords");
            }
            return answer;
        } catch (RuntimeException e) {
            Duration pause = isBusy(e) ? PAUSE_AFTER_BUSY : PAUSE_AFTER_FAILURE;
            aiPausedUntil = clock.instant().plus(pause);
            log.warn("AI category suggestion failed ({}: {}); using keywords, AI paused for {} s",
                    e.getClass().getSimpleName(), e.getMessage(), pause.toSeconds());
            return Optional.empty();
        }
    }
}
