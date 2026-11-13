package com.itsm.incident.state;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * The value stored in the database. Each status is linked to a state object
 * (see IncidentStates) that holds the behaviour for that status.
 */
public enum IncidentStatus {
    NEW,
    CLASSIFIED,
    ASSIGNED,
    ACKNOWLEDGED,
    IN_PROGRESS,
    AWAITING_INFO,
    RESOLVED,
    VERIFIED,
    CLOSED;

    /** A technician is actively responsible: these count toward the technician's workload. */
    public static final Set<IncidentStatus> ACTIVE_WORK =
            Collections.unmodifiableSet(EnumSet.of(ASSIGNED, ACKNOWLEDGED, IN_PROGRESS, AWAITING_INFO));

    /** The State object for this status. */
    public IncidentState state() {
        return IncidentStates.of(this);
    }
}
