package com.itsm.intelligence;

import com.itsm.catalog.Category;
import com.itsm.catalog.CategoryRepository;
import com.itsm.intelligence.dto.CategorySuggestionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.itsm.support.TestFixtures.category;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Uses the same keywords as the demo catalog. */
class CategorySuggesterTest {

    private Category authentication;
    private CategorySuggester suggester;

    @BeforeEach
    void setUp() {
        authentication = category(7, "AUTHENTICATION", "login", "log in", "password", "sso", "otp", "locked",
                "authentication", "sign in", "mfa", "access denied");
        List<Category> categories = List.of(
                category(1, "HARDWARE", "laptop", "desktop", "printer", "monitor", "keyboard", "mouse", "hardware", "screen", "battery"),
                category(3, "NETWORK", "network", "wifi", "wi-fi", "vpn", "internet", "connectivity", "router", "latency", "dns", "slow"),
                category(4, "DATABASE", "database", "db", "query", "sql", "postgres", "deadlock", "replication", "records"),
                authentication,
                category(8, "APPLICATION", "application", "app", "payment", "transaction", "portal", "checkout", "email", "error", "unavailable"));
        CategoryRepository repository = mock(CategoryRepository.class);
        when(repository.findAll()).thenReturn(categories);
        suggester = new CategorySuggester(repository);
    }

    @Test
    @DisplayName("Login problem → AUTHENTICATION with the matched keywords (multi-word keywords too)")
    void authentication() {
        List<CategorySuggestionResponse> result = suggester.suggest("Cannot log in, password rejected", "SSO says access denied");
        assertThat(result.get(0).code()).isEqualTo("AUTHENTICATION");
        assertThat(result.get(0).matchedKeywords()).containsExactly("access denied", "log in", "password", "sso");
    }

    @Test
    @DisplayName("Word endings don't matter: 'queries' matches the keyword 'query'")
    void stemmedMatch() {
        assertThat(suggester.suggest("Database queries timing out", null).get(0).matchedKeywords())
                .containsExactly("database", "query");
    }

    @Test
    @DisplayName("Ranked by number of matches")
    void ranking() {
        assertThat(suggester.suggest("VPN slow and payment app error", null))
                .extracting(CategorySuggestionResponse::code, CategorySuggestionResponse::matchCount)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("APPLICATION", 3), org.assertj.core.groups.Tuple.tuple("NETWORK", 2));
    }

    @Test
    @DisplayName("Inactive categories are never suggested")
    void inactiveIgnored() {
        authentication.deactivate();
        assertThat(suggester.suggest("password reset", null)).isEmpty();
    }

    @Test
    @DisplayName("Nothing matches → empty list")
    void nothing() {
        assertThat(suggester.suggest("hello there", null)).isEmpty();
    }
}
