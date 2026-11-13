package com.itsm.incident.assignment;

import java.util.List;

/**
 * Strategy pattern: one way of choosing a technician for an incident.
 *
 * Implementations are Spring beans; AssignmentStrategyRegistry collects all of them, so adding a
 * new strategy means adding one class, with no change to IncidentService or the registry.
 * Strategies are pure: they only read the AssignmentContext they are given (no database access),
 * which keeps them easy to reason about and to unit-test.
 */
public interface AssignmentStrategy {

    /** Stable identifier stored in the settings and used in the API, e.g. "SMART". */
    String name();

    /** One sentence for the admin screen. */
    String description();

    /** Suitable candidates, best first. Empty when nobody fits this strategy. */
    List<RankedCandidate> rank(AssignmentContext context);

    /** Why rank() returned nothing although technicians were available. */
    default String explainNoMatch(AssignmentContext context) {
        return "no available technician fits the " + name() + " strategy";
    }
}
