package com.itsm.intelligence;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class TextNormalizerTest {

    @Test
    @DisplayName("Lower case, punctuation removed, filler words dropped, endings trimmed")
    void normalises() {
        assertThat(TextNormalizer.words("Payments are FAILING at checkout!")).containsExactly("payment", "fail", "checkout");
        assertThat(TextNormalizer.words("Unable to make payment")).containsExactly("payment");
        assertThat(TextNormalizer.words(null)).isEmpty();
    }

    @ParameterizedTest(name = "{0} → {1}")
    @CsvSource({"queries, query", "denied, deny", "failing, fail", "payments, payment", "access, access",
            "status, status", "crashed, crash", "vpn, vpn"})
    void stems(String word, String expected) {
        assertThat(TextNormalizer.stem(word)).isEqualTo(expected);
    }

    @Test
    @DisplayName("Jaccard = shared words ÷ all distinct words")
    void jaccard() {
        assertThat(TextNormalizer.jaccard(Set.of("a", "b"), Set.of("b", "c"))).isCloseTo(1.0 / 3, within(1e-9));
        assertThat(TextNormalizer.jaccard(Set.of("a"), Set.of("a"))).isEqualTo(1.0);
        assertThat(TextNormalizer.jaccard(Set.of(), Set.of("a"))).isZero();
    }
}
