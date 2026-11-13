package com.itsm.incident.assignment;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Smart technician recommendation: a weighted score out of 100 that combines several factors.
 *
 *   skill in the incident's category ............ 40
 *   free capacity (share of limit unused) ........ up to 25
 *   earlier incidents resolved on this service ... 5 each, up to 15
 *   experience ................................... 1 per year, up to 10
 *   senior technician on a P1/P2 incident ........ 10
 *
 * Every factor adds a reason line, so the admin can see WHY someone was recommended.
 */
@Component
@Order(3)
public class SmartScoreAssignmentStrategy extends AbstractAssignmentStrategy {

    public static final String NAME = "SMART";

    static final int SKILL_POINTS = 40;
    static final int CAPACITY_POINTS = 25;
    static final int HISTORY_POINTS_EACH = 5;
    static final int HISTORY_MAX_COUNTED = 3;
    static final int EXPERIENCE_MAX_POINTS = 10;
    static final int SENIORITY_POINTS = 10;

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public String description() {
        return "Weighted score out of 100: skill match 40, free capacity 25, earlier incidents on the same "
                + "service 15, experience 10, seniority 10 for P1/P2";
    }

    @Override
    protected CandidateScore score(CandidateProfile c, AssignmentContext context) {
        List<String> reasons = new ArrayList<>();
        int total = 0;

        int skill = c.skilledInCategory() ? SKILL_POINTS : 0;
        reasons.add((c.skilledInCategory() ? "Skill in " : "No skill in ") + context.categoryCode() + points(skill));
        total += skill;

        int capacity = (int) Math.round(CAPACITY_POINTS * c.freeCapacityRatio());
        reasons.add(c.workloadText() + points(capacity));
        total += capacity;

        int counted = (int) Math.min(c.resolvedOnService(), HISTORY_MAX_COUNTED);
        int history = counted * HISTORY_POINTS_EACH;
        reasons.add(c.resolvedOnService() == 0
                ? "No earlier incidents on " + context.serviceName() + points(0)
                : "Resolved " + c.resolvedOnService() + " earlier incident(s) on " + context.serviceName() + points(history));
        total += history;

        int experience = Math.min(c.experienceYears(), EXPERIENCE_MAX_POINTS);
        reasons.add(c.experienceText() + points(experience));
        total += experience;

        if (context.isUrgent()) {
            int seniority = c.senior() ? SENIORITY_POINTS : 0;
            reasons.add((c.senior() ? "Senior technician" : "Not a senior technician")
                    + " for a " + context.priority() + " incident" + points(seniority));
            total += seniority;
        }
        return new CandidateScore(total, reasons);
    }

    private static String points(int points) {
        return " (+" + points + ")";
    }
}
