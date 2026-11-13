package com.itsm.incident.assignment;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Spreads work evenly: the technician with the most free capacity wins, skills are ignored. */
@Component
@Order(2)
public class LeastLoadedAssignmentStrategy extends AbstractAssignmentStrategy {

    public static final String NAME = "LEAST_LOADED";

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public String description() {
        return "Ignores skills; the technician with the most free capacity (relative to their limit) wins "
                + "(ties: more experience)";
    }

    @Override
    protected CandidateScore score(CandidateProfile candidate, AssignmentContext context) {
        String skill = (candidate.skilledInCategory() ? "Skill in " : "No skill in ") + context.categoryCode()
                + " (not used by this strategy)";
        return new CandidateScore(candidate.freeCapacityPercent(), List.of(
                candidate.workloadText(), skill, candidate.experienceText()));
    }
}
