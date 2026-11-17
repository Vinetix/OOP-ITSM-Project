package com.itsm.intelligence;

import com.itsm.catalog.Category;
import com.itsm.catalog.CategoryRepository;
import com.itsm.intelligence.ai.AiCategoryChoice;
import com.itsm.intelligence.ai.AiCategoryClient;
import com.itsm.intelligence.ai.CategoryOption;
import com.itsm.intelligence.ai.DisabledAiCategoryClient;
import com.itsm.intelligence.dto.CategorySuggestionResponse;
import com.itsm.intelligence.dto.SuggestionSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static com.itsm.support.TestFixtures.T0;
import static com.itsm.support.TestFixtures.category;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** AI first, keywords as the safety net: the rules from PHASE9_CONTRACT. */
class CategorySuggestionServiceTest {

    private static final String TITLE = "Cannot log in, password rejected";
    private static final String TEXT = "SSO says access denied and the VPN is slow";

    private CategoryRepository repository;
    private CategorySuggester keywordSuggester;
    private MutableClock clock;

    /** A fake AI that counts calls and answers whatever the test supplies. */
    private static final class FakeAi implements AiCategoryClient {
        private final Supplier<Optional<AiCategoryChoice>> answer;
        int calls;

        FakeAi(Supplier<Optional<AiCategoryChoice>> answer) {
            this.answer = answer;
        }

        @Override
        public String provider() {
            return "GEMINI";
        }

        @Override
        public boolean isEnabled() {
            return true;
        }

        @Override
        public Optional<AiCategoryChoice> chooseCategory(String title, String description, List<CategoryOption> options) {
            calls++;
            return answer.get();
        }
    }

    private static final class MutableClock extends Clock {
        Instant now = T0;

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @BeforeEach
    void setUp() {
        List<Category> categories = List.of(
                category(3, "NETWORK", "vpn", "slow", "network"),
                category(7, "AUTHENTICATION", "password", "sso", "access denied", "log in"),
                category(1, "HARDWARE", "laptop"));
        repository = mock(CategoryRepository.class);
        when(repository.findAll()).thenReturn(categories);
        keywordSuggester = new CategorySuggester(repository);
        clock = new MutableClock();
    }

    private CategorySuggestionService service(AiCategoryClient ai) {
        return new CategorySuggestionService(keywordSuggester, repository, ai, clock);
    }

    @Test
    @DisplayName("AI on: the AI's pick comes first with its reason, then keyword suggestions for other categories")
    void aiFirstThenKeywords() {
        FakeAi ai = new FakeAi(() -> Optional.of(new AiCategoryChoice("AUTHENTICATION", "The user cannot sign in.")));
        List<CategorySuggestionResponse> result = service(ai).suggest(TITLE, TEXT);

        assertThat(result.get(0).code()).isEqualTo("AUTHENTICATION");
        assertThat(result.get(0).source()).isEqualTo(SuggestionSource.AI);
        assertThat(result.get(0).reason()).isEqualTo("The user cannot sign in.");
        assertThat(result.get(0).matchedKeywords()).contains("password", "sso"); // keywords that also matched
        assertThat(result).hasSize(2);
        assertThat(result.get(1).code()).isEqualTo("NETWORK");
        assertThat(result.get(1).source()).isEqualTo(SuggestionSource.KEYWORDS);
        assertThat(result.get(1).reason()).isNull();
    }

    @Test
    @DisplayName("AI off: exactly the keyword suggestions, all marked KEYWORDS")
    void aiOff() {
        List<CategorySuggestionResponse> result = service(new DisabledAiCategoryClient()).suggest(TITLE, TEXT);
        assertThat(result).isNotEmpty().allMatch(r -> r.source() == SuggestionSource.KEYWORDS && r.reason() == null);
        assertThat(result.get(0).code()).isEqualTo("AUTHENTICATION");
    }

    @Test
    @DisplayName("AI error: keywords instead, and the AI is paused for a minute")
    void aiErrorFallsBackAndPauses() {
        FakeAi ai = new FakeAi(() -> {
            throw new IllegalStateException("429 Too Many Requests");
        });
        CategorySuggestionService service = service(ai);
        assertThat(service.suggest(TITLE, TEXT)).allMatch(r -> r.source() == SuggestionSource.KEYWORDS);
        assertThat(service.suggest(TITLE + " again", TEXT)).allMatch(r -> r.source() == SuggestionSource.KEYWORDS);
        assertThat(ai.calls).isEqualTo(1);                      // paused: not called again
        clock.now = T0.plusSeconds(61);
        service.suggest(TITLE + " later", TEXT);
        assertThat(ai.calls).isEqualTo(2);                      // tried again after the pause
    }

    @Test
    @DisplayName("Model busy (503): keywords now, AI tried again after only 15 s")
    void busyModelPausesBriefly() {
        FakeAi ai = new FakeAi(() -> {
            throw new IllegalStateException("503 Service Unavailable: high demand");
        });
        CategorySuggestionService service = service(ai);
        service.suggest(TITLE, TEXT);
        clock.now = T0.plusSeconds(16);
        service.suggest(TITLE + " later", TEXT);
        assertThat(ai.calls).isEqualTo(2);
    }

    @Test
    @DisplayName("AI answers with an unknown/empty result: keywords instead")
    void aiNoUsableAnswer() {
        assertThat(service(new FakeAi(Optional::empty)).suggest(TITLE, TEXT))
                .allMatch(r -> r.source() == SuggestionSource.KEYWORDS);
        assertThat(service(new FakeAi(() -> Optional.of(new AiCategoryChoice("PRINTING", "x")))).suggest(TITLE, TEXT))
                .allMatch(r -> r.source() == SuggestionSource.KEYWORDS);
    }

    @Test
    @DisplayName("Same text again: the cached AI answer is reused (one call only)")
    void cachesAnswers() {
        FakeAi ai = new FakeAi(() -> Optional.of(new AiCategoryChoice("NETWORK", "VPN problem.")));
        CategorySuggestionService service = service(ai);
        service.suggest(TITLE, TEXT);
        service.suggest("  " + TITLE + " ", TEXT);
        assertThat(ai.calls).isEqualTo(1);
    }

    @Test
    @DisplayName("Very short titles don't call the AI")
    void shortTitleSkipsAi() {
        FakeAi ai = new FakeAi(() -> Optional.of(new AiCategoryChoice("NETWORK", "x")));
        service(ai).suggest("vpn", null);
        assertThat(ai.calls).isZero();
    }

    @Test
    @DisplayName("Status: on with provider, or off without provider")
    void status() {
        assertThat(service(new FakeAi(Optional::empty)).status().aiEnabled()).isTrue();
        assertThat(service(new FakeAi(Optional::empty)).status().provider()).isEqualTo("GEMINI");
        assertThat(service(new DisabledAiCategoryClient()).status().aiEnabled()).isFalse();
        assertThat(service(new DisabledAiCategoryClient()).status().provider()).isNull();
    }
}
