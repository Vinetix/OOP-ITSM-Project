package com.itsm.incident.assignment;

import com.itsm.common.exception.InvalidRequestException;
import com.itsm.incident.priority.Priority;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

/**
 * Strategy + Template Method: the three assignment strategies on the demo situation
 * (Fatima, Sneha, Ravi each have 1 active incident, Arjun none).
 */
class AssignmentStrategiesTest {

    private static final CandidateProfile ARJUN = new CandidateProfile(5L, "Arjun Mehta", false, 1, 0, 4, false, 0);
    private static final CandidateProfile FATIMA = new CandidateProfile(3L, "Fatima Khan", true, 11, 1, 6, true, 0);
    private static final CandidateProfile RAVI = new CandidateProfile(2L, "Ravi Kumar", true, 9, 1, 6, false, 0);
    private static final CandidateProfile SNEHA = new CandidateProfile(4L, "Sneha Reddy", false, 4, 1, 5, false, 0);

    /** INC00008: Customer Database, DATABASE category, P1. Only Fatima has a DATABASE skill. */
    private static final AssignmentContext CUSTOMER_DB_P1 =
            new AssignmentContext(8L, "DATABASE", "Customer Database", Priority.P1, List.of(ARJUN, FATIMA, RAVI, SNEHA));

    @Test
    @DisplayName("SMART: weighted score out of 100 (Fatima 81, Ravi 40, Arjun 26, Sneha 24)")
    void smartRanking() {
        List<RankedCandidate> ranking = new SmartScoreAssignmentStrategy().rank(CUSTOMER_DB_P1);
        assertThat(ranking).extracting(RankedCandidate::fullName, RankedCandidate::score).containsExactly(
                tuple("Fatima Khan", 81), tuple("Ravi Kumar", 40), tuple("Arjun Mehta", 26), tuple("Sneha Reddy", 24));
        assertThat(ranking.get(0).reasons()).containsExactly(
                "Skill in DATABASE (+40)",
                "1 of 6 slots in use (83% free) (+21)",
                "No earlier incidents on Customer Database (+0)",
                "11 years' experience (+10)",
                "Senior technician for a P1 incident (+10)");
    }

    @Test
    @DisplayName("SKILL_BASED: only technicians with the category skill")
    void skillBased() {
        assertThat(new SkillBasedAssignmentStrategy().rank(CUSTOMER_DB_P1))
                .extracting(RankedCandidate::fullName, RankedCandidate::score)
                .containsExactly(tuple("Fatima Khan", 83));
    }

    @Test
    @DisplayName("LEAST_LOADED: most free capacity first; ties broken by experience")
    void leastLoaded() {
        assertThat(new LeastLoadedAssignmentStrategy().rank(CUSTOMER_DB_P1))
                .extracting(RankedCandidate::fullName, RankedCandidate::score)
                .containsExactly(tuple("Arjun Mehta", 100), tuple("Fatima Khan", 83),
                        tuple("Ravi Kumar", 83), tuple("Sneha Reddy", 80));
    }

    @Test
    @DisplayName("SMART: history on the same service adds 5 per incident, up to 15")
    void smartServiceHistory() {
        CandidateProfile experienced = new CandidateProfile(9L, "Expert", false, 0, 0, 5, false, 7);
        AssignmentContext p3 = new AssignmentContext(1L, "NETWORK", "VPN", Priority.P3, List.of(experienced));
        RankedCandidate ranked = new SmartScoreAssignmentStrategy().rank(p3).get(0);
        assertThat(ranked.reasons()).contains("Resolved 7 earlier incident(s) on VPN (+15)");
        assertThat(ranked.score()).isEqualTo(0 + 25 + 15 + 0); // no skill, full capacity, history capped, 0 years
    }

    @Test
    @DisplayName("SMART: the seniority bonus only applies to P1/P2")
    void seniorityOnlyWhenUrgent() {
        AssignmentContext p3 = new AssignmentContext(1L, "DATABASE", "Customer Database", Priority.P3, List.of(FATIMA));
        RankedCandidate ranked = new SmartScoreAssignmentStrategy().rank(p3).get(0);
        assertThat(ranked.score()).isEqualTo(71);
        assertThat(ranked.reasons()).noneMatch(reason -> reason.contains("Senior"));
    }

    @Test
    @DisplayName("SKILL_BASED explains why nobody fits")
    void skillBasedExplainsNoMatch() {
        // skilledInCategory is per incident: for this NETWORK incident nobody available has the skill
        CandidateProfile fatimaWithoutNetworkSkill = new CandidateProfile(3L, "Fatima Khan", true, 11, 1, 6, false, 0);
        AssignmentContext network = new AssignmentContext(1L, "NETWORK", "VPN", Priority.P2,
                List.of(ARJUN, SNEHA, fatimaWithoutNetworkSkill));
        SkillBasedAssignmentStrategy strategy = new SkillBasedAssignmentStrategy();
        assertThat(strategy.rank(network)).isEmpty();
        assertThat(strategy.explainNoMatch(network)).isEqualTo("none of the 3 available technicians has an active skill in NETWORK");
        AssignmentContext single = new AssignmentContext(1L, "CLOUD", "X", Priority.P3, List.of(ARJUN));
        assertThat(strategy.explainNoMatch(single)).isEqualTo("the only available technician has no active skill in CLOUD");
    }

    @Test
    @DisplayName("Registry: finds strategies by name, case-insensitively")
    void registryFindsByName() {
        AssignmentStrategyRegistry registry = registry();
        assertThat(registry.get("smart").name()).isEqualTo("SMART");
        assertThat(registry.get(" least_loaded ").name()).isEqualTo("LEAST_LOADED");
        assertThat(registry.all()).extracting(AssignmentStrategy::name).containsExactly("SKILL_BASED", "LEAST_LOADED", "SMART");
    }

    @Test
    @DisplayName("Registry: an unknown name is a 400 listing the available strategies")
    void registryRejectsUnknown() {
        assertThatThrownBy(() -> registry().get("RANDOM"))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Available: SKILL_BASED, LEAST_LOADED, SMART");
    }

    @Test
    @DisplayName("Registry: two strategies with the same name are a startup error")
    void registryRejectsDuplicates() {
        assertThatThrownBy(() -> new AssignmentStrategyRegistry(List.of(new SmartScoreAssignmentStrategy(), new SmartScoreAssignmentStrategy())))
                .isInstanceOf(IllegalStateException.class);
    }

    private static AssignmentStrategyRegistry registry() {
        return new AssignmentStrategyRegistry(List.of(
                new SkillBasedAssignmentStrategy(), new LeastLoadedAssignmentStrategy(), new SmartScoreAssignmentStrategy()));
    }
}
