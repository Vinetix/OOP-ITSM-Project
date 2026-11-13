package com.itsm.incident.assignment;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Only technicians with an active skill in the incident's category; the least loaded of them wins. */
@Component
@Order(1)
public class SkillBasedAssignmentStrategy extends AbstractAssignmentStrategy {

    public static final String NAME = "SKILL_BASED";

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public String description() {
        return "Only technicians with an active skill in the incident's category; "
                + "the one with the most free capacity wins (ties: more experience)";
    }

    @Override
    protected boolean isSuitable(CandidateProfile candidate, AssignmentContext context) {
        return candidate.skilledInCategory();
    }

    @Override
    protected CandidateScore score(CandidateProfile candidate, AssignmentContext context) {
        return new CandidateScore(candidate.freeCapacityPercent(), List.of(
                "Active skill in " + context.categoryCode(),
                candidate.workloadText(),
                candidate.experienceText()));
    }

    @Override
    public String explainNoMatch(AssignmentContext context) {
        int available = context.candidates().size();
        String who = available == 1 ? "the only available technician has no"
                : "none of the " + available + " available technicians has an";
        return who + " active skill in " + context.categoryCode();
    }
}
