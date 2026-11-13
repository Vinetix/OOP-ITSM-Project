package com.itsm.incident.state;

import java.util.Set;

/**
 * State pattern: the behaviour that depends on an incident's current status.
 * Incident never contains "if status == X" logic; it asks its current state object.
 */
public interface IncidentState {

    IncidentStatus status();

    /**
     * The status an action leads to from this state.
     * @throws InvalidStateTransitionException if the action is not allowed here
     */
    IncidentStatus next(IncidentAction action);

    boolean allows(IncidentAction action);

    Set<IncidentAction> allowedActions();

    /** Can title, description, impact, urgency, service, category still be changed? */
    boolean isEditable();

    /** Can comments / work notes still be added? */
    boolean acceptsNotes();
}
