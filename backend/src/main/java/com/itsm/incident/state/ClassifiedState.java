package com.itsm.incident.state;

import java.util.Map;

/** Classified and prioritized; waiting for a technician. */
final class ClassifiedState extends AbstractIncidentState {

    ClassifiedState() {
        super(IncidentStatus.CLASSIFIED, Map.of(IncidentAction.ASSIGN, IncidentStatus.ASSIGNED));
    }

    @Override
    public boolean isEditable() {
        return true;
    }
}
