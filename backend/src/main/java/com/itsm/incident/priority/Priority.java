package com.itsm.incident.priority;

/**
 * Incident priority, P1 (most urgent) to P4. Calculated automatically in Phase 4
 * by a PriorityStrategy; used here by SLA policies to pick response/resolution targets.
 */
public enum Priority {
    P1("Critical"),
    P2("High"),
    P3("Medium"),
    P4("Low");

    private final String label;

    Priority(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
