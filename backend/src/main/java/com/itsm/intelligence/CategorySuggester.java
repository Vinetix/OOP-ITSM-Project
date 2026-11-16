package com.itsm.intelligence;

import com.itsm.catalog.Category;
import com.itsm.catalog.CategoryRepository;
import com.itsm.intelligence.dto.CategorySuggestionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Intelligent feature: category suggestion. Each active category has keywords (managed by the admin in
 * the catalog). A keyword matches when all of its words appear in the incident text, after the same
 * normalisation (so "log in" matches "logging in", "queries" matches "query"). Categories are ranked by
 * the number of matched keywords; ties go to the category name.
 */
@Component
@RequiredArgsConstructor
public class CategorySuggester {

    static final int MAX_RESULTS = 3;

    private final CategoryRepository categoryRepository;

    public List<CategorySuggestionResponse> suggest(String title, String description) {
        Set<String> words = TextNormalizer.words(title + " " + (description == null ? "" : description));
        if (words.isEmpty()) {
            return List.of();
        }
        List<CategorySuggestionResponse> ranked = new ArrayList<>();
        for (Category category : categoryRepository.findAll()) {
            if (!category.isActive()) {
                continue;
            }
            List<String> matched = category.getKeywords().stream()
                    .filter(keyword -> {
                        Set<String> keywordWords = TextNormalizer.words(keyword);
                        return !keywordWords.isEmpty() && words.containsAll(keywordWords);
                    })
                    .sorted()
                    .toList();
            if (!matched.isEmpty()) {
                ranked.add(new CategorySuggestionResponse(category.getId(), category.getCode(), category.getName(),
                        matched.size(), matched));
            }
        }
        return ranked.stream()
                .sorted(Comparator.comparingInt(CategorySuggestionResponse::matchCount).reversed()
                        .thenComparing(CategorySuggestionResponse::name))
                .limit(MAX_RESULTS)
                .toList();
    }
}
