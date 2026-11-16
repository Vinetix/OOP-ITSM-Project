package com.itsm.incident.priority;

import com.itsm.catalog.BusinessCriticality;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/** Strategy pattern: Impact × Urgency × Criticality × users multiplier → score → P1–P4. */
class WeightedScorePriorityStrategyTest {

    private final WeightedScorePriorityStrategy strategy = new WeightedScorePriorityStrategy();

    @ParameterizedTest(name = "{0} × {1} × {2}, {3} users → score {4} → {5}")
    @CsvSource({
            "HIGH,     HIGH,     CRITICAL, 80,   36, P1",   // the payment demo incident
            "LOW,      LOW,      LOW,      1,    1,  P4",
            "MEDIUM,   MEDIUM,   LOW,      1,    4,  P4",
            "MEDIUM,   HIGH,     LOW,      1,    6,  P3",   // lowest P3 score
            "MEDIUM,   MEDIUM,   HIGH,     99,   12, P3",   // just below the 100-user multiplier
            "MEDIUM,   MEDIUM,   HIGH,     100,  15, P3",   // ×1.25
            "MEDIUM,   MEDIUM,   HIGH,     1000, 18, P2",   // ×1.5 pushes it to P2
            "CRITICAL, CRITICAL, LOW,      1,    16, P2",   // lowest P2 score
            "HIGH,     HIGH,     HIGH,     1,    27, P2",
            "HIGH,     HIGH,     HIGH,     100,  34, P1",   // 27 × 1.25 = 33.75 → 34
            "CRITICAL, CRITICAL, MEDIUM,   1,    32, P1"    // lowest P1 score
    })
    void calculatesScoreAndPriority(Impact impact, Urgency urgency, BusinessCriticality criticality, int users,
                                    int expectedScore, Priority expectedPriority) {
        PriorityResult result = strategy.calculate(new PriorityInput(impact, urgency, criticality, users));
        assertThat(result.score()).isEqualTo(expectedScore);
        assertThat(result.priority()).isEqualTo(expectedPriority);
    }

    @Test
    @DisplayName("The explanation shows the formula, including the users multiplier")
    void explanationShowsTheFormula() {
        PriorityResult result = strategy.calculate(new PriorityInput(Impact.HIGH, Urgency.HIGH, BusinessCriticality.HIGH, 100));
        assertThat(result.explanation())
                .contains("Impact HIGH(3) x Urgency HIGH(3) x Criticality HIGH(3) = 27")
                .contains("x1.25 (100 users affected)")
                .endsWith("score 34 -> P1");
    }
}
