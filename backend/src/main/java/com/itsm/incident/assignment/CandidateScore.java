package com.itsm.incident.assignment;

import java.util.List;

/** What a strategy thinks of one candidate: points (0-100) and human-readable reasons. */
public record CandidateScore(int points, List<String> reasons) {

    public CandidateScore {
        reasons = List.copyOf(reasons);
    }
}
