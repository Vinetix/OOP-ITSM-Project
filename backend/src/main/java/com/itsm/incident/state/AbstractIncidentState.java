package com.itsm.incident.state;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Shared logic for all states. Each concrete state only declares its own transitions;
 * anything it doesn't declare is blocked by default. That is what prevents NEW -> CLOSED.
 */
abstract class AbstractIncidentState implements IncidentState {

    private final IncidentStatus status;
    private final Map<IncidentAction, IncidentStatus> transitions;

    protected AbstractIncidentState(IncidentStatus status, Map<IncidentAction, IncidentStatus> transitions) {
        this.status = status;
        this.transitions = transitions.isEmpty()
                ? Map.of()
                : Collections.unmodifiableMap(new EnumMap<>(transitions));
    }

    @Override
    public IncidentStatus status() {
        return status;
    }

    @Override
    public IncidentStatus next(IncidentAction action) {
        IncidentStatus target = transitions.get(action);
        if (target == null) {
            throw new InvalidStateTransitionException(status, action, allowedActions());
        }
        return target;
    }

    @Override
    public boolean allows(IncidentAction action) {
        return transitions.containsKey(action);
    }

    @Override
    public Set<IncidentAction> allowedActions() {
        return transitions.isEmpty()
                ? Set.of()
                : Collections.unmodifiableSet(EnumSet.copyOf(transitions.keySet()));
    }

    /** Default: details are frozen. Open states override this. */
    @Override
    public boolean isEditable() {
        return false;
    }

    /** Default: notes allowed. ClosedState overrides this. */
    @Override
    public boolean acceptsNotes() {
        return true;
    }
}
