package com.itsm.incident.state;

import com.itsm.common.exception.BusinessRuleViolationException;

import java.util.Set;

/** Thrown when an action is not allowed in the incident's current status (e.g. NEW -> CLOSE). */
public class InvalidStateTransitionException extends BusinessRuleViolationException {

    public InvalidStateTransitionException(IncidentStatus from, IncidentAction action, Set<IncidentAction> allowed) {
        super("INVALID_STATE_TRANSITION",
                "Cannot " + action + " an incident in status " + from + ". Allowed actions: "
                        + (allowed.isEmpty() ? "none" : allowed));
    }
}
