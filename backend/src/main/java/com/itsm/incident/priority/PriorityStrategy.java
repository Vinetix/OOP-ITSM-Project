package com.itsm.incident.priority;

/**
 * Strategy pattern: "how do we turn impact, urgency, criticality and affected users into P1-P4?"
 * IncidentService depends only on this interface, so the algorithm can be replaced
 * (e.g. a rule-based or historical-data strategy) without touching incident code.
 */
public interface PriorityStrategy {

    PriorityResult calculate(PriorityInput input);

    /** Short name shown to admins, e.g. "WEIGHTED_SCORE". */
    String name();
}
