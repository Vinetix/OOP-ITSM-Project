package com.itsm.intelligence;

import com.itsm.catalog.Category;
import com.itsm.catalog.ITService;
import com.itsm.incident.Incident;
import com.itsm.incident.IncidentRepository;
import com.itsm.intelligence.dto.SimilarIncidentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Intelligent feature: duplicate detection / incident correlation.
 *
 * Compares a text (title + description) with recent incidents that aren't closed:
 *   score = 0.6 × Jaccard(title words) + 0.4 × Jaccard(all words)
 *         + 0.15 if on the same service + 0.05 if in the same category   (bonuses only when the texts
 *           share something, so "same service" alone never makes a duplicate)
 * An incident is reported as similar when the score is at least 0.35 (35 out of 100).
 */
@Component
@RequiredArgsConstructor
public class DuplicateDetector {

    static final Duration WINDOW = Duration.ofDays(7);
    static final double TITLE_WEIGHT = 0.6;
    static final double TEXT_WEIGHT = 0.4;
    static final double SAME_SERVICE_BONUS = 0.15;
    static final double SAME_CATEGORY_BONUS = 0.05;
    static final double MIN_TEXT_SCORE = 0.10;
    static final double THRESHOLD = 0.35;
    static final int MAX_RESULTS = 5;

    private final IncidentRepository incidentRepository;
    private final Clock clock;

    /**
     * @param excludeId incident to leave out (the one being compared), or null for a new report
     */
    public List<SimilarIncidentResponse> findSimilar(String title, String description, ITService service,
                                                     Category category, Long excludeId) {
        Set<String> titleWords = TextNormalizer.words(title);
        Set<String> allWords = TextNormalizer.words(title + " " + (description == null ? "" : description));
        if (allWords.isEmpty()) {
            return List.of();
        }
        return incidentRepository.findSimilarityCandidates(clock.instant().minus(WINDOW)).stream()
                .filter(candidate -> !candidate.getId().equals(excludeId))
                .map(candidate -> score(candidate, titleWords, allWords, service, category))
                .filter(result -> result != null)
                .sorted(Comparator.comparingInt(SimilarIncidentResponse::score).reversed()
                        .thenComparing(SimilarIncidentResponse::reportedAt, Comparator.reverseOrder()))
                .limit(MAX_RESULTS)
                .toList();
    }

    private SimilarIncidentResponse score(Incident candidate, Set<String> titleWords, Set<String> allWords,
                                          ITService service, Category category) {
        Set<String> candidateTitle = TextNormalizer.words(candidate.getTitle());
        Set<String> candidateAll = TextNormalizer.words(candidate.getTitle() + " " + candidate.getDescription());
        double text = TITLE_WEIGHT * TextNormalizer.jaccard(titleWords, candidateTitle)
                + TEXT_WEIGHT * TextNormalizer.jaccard(allWords, candidateAll);
        if (text < MIN_TEXT_SCORE) {
            return null;
        }
        boolean sameService = service != null && candidate.getService().getId().equals(service.getId());
        boolean sameCategory = category != null && candidate.getCategory() != null
                && candidate.getCategory().getId().equals(category.getId());
        double total = Math.min(1.0, text + (sameService ? SAME_SERVICE_BONUS : 0) + (sameCategory ? SAME_CATEGORY_BONUS : 0));
        if (total < THRESHOLD) {
            return null;
        }
        List<String> shared = allWords.stream().filter(candidateAll::contains).toList();
        return SimilarIncidentResponse.from(candidate, (int) Math.round(total * 100), shared, sameService, sameCategory);
    }
}
