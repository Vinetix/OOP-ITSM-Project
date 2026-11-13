package com.itsm.incident.priority;

import org.springframework.stereotype.Component;

/**
 * Score = Impact x Urgency x Business criticality (each weighted 1-4, so 1..64),
 * then x1.25 if 100+ users are affected, or x1.5 if 1000+ users.
 *
 *   score >= 32 -> P1 Critical   e.g. payment app down: 4 x 4 x 4 = 64
 *   score >= 16 -> P2 High       e.g. VPN unstable for a team: 2 x 3 x 3 = 18
 *   score >=  6 -> P3 Medium     e.g. one user's email broken: 1 x 2 x 3 = 6
 *   otherwise   -> P4 Low        e.g. one laptop battery: 1 x 1 x 1 = 1
 */
@Component
public class WeightedScorePriorityStrategy implements PriorityStrategy {

    static final int P1_MIN_SCORE = 32;
    static final int P2_MIN_SCORE = 16;
    static final int P3_MIN_SCORE = 6;

    @Override
    public PriorityResult calculate(PriorityInput input) {
        int base = input.impact().getWeight() * input.urgency().getWeight() * input.criticality().getWeight();
        double multiplier = affectedUsersMultiplier(input.affectedUsers());
        int score = (int) Math.round(base * multiplier);
        Priority priority = toPriority(score);

        String explanation = String.format("Impact %s(%d) x Urgency %s(%d) x Criticality %s(%d) = %d%s -> score %d -> %s",
                input.impact(), input.impact().getWeight(),
                input.urgency(), input.urgency().getWeight(),
                input.criticality(), input.criticality().getWeight(),
                base,
                multiplier > 1.0 ? " x" + multiplier + " (" + input.affectedUsers() + " users affected)" : "",
                score, priority);

        return new PriorityResult(priority, score, explanation);
    }

    @Override
    public String name() {
        return "WEIGHTED_SCORE";
    }

    private double affectedUsersMultiplier(int affectedUsers) {
        if (affectedUsers >= 1000) {
            return 1.5;
        }
        if (affectedUsers >= 100) {
            return 1.25;
        }
        return 1.0;
    }

    private Priority toPriority(int score) {
        if (score >= P1_MIN_SCORE) {
            return Priority.P1;
        }
        if (score >= P2_MIN_SCORE) {
            return Priority.P2;
        }
        if (score >= P3_MIN_SCORE) {
            return Priority.P3;
        }
        return Priority.P4;
    }
}
