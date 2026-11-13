package com.itsm.incident.assignment;

import com.itsm.user.Technician;

/**
 * The active strategy's pick for an incident: either a technician (with their ranking)
 * or the reason nobody could be chosen.
 */
public record AssignmentProposal(String strategy, Technician technician, RankedCandidate ranking,
                                 String noCandidateReason) {

    static AssignmentProposal of(String strategy, Technician technician, RankedCandidate ranking) {
        return new AssignmentProposal(strategy, technician, ranking, null);
    }

    static AssignmentProposal none(String strategy, String reason) {
        return new AssignmentProposal(strategy, null, null, reason);
    }

    public boolean hasCandidate() {
        return technician != null;
    }

    /** Appended to the audit text, e.g. " by SMART strategy (score 81/100)". */
    public String describe() {
        return " by " + strategy + " strategy (score " + ranking.score() + "/100)";
    }
}
