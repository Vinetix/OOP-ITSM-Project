package com.itsm.incident.assignment;

import java.util.List;

/** One technician in a strategy's ranking (also returned as-is by the recommendations endpoint). */
public record RankedCandidate(Long technicianId, String fullName, int score, List<String> reasons) {

    public RankedCandidate {
        reasons = List.copyOf(reasons);
    }
}
