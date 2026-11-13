package com.itsm.incident.state;

import java.util.Map;

/** A technician is assigned but hasn't acknowledged yet (response SLA still running). Can be re-assigned. */
final class AssignedState extends AbstractIncidentState {

    AssignedState() {
        super(IncidentStatus.ASSIGNED, Map.of(
                IncidentAction.ACKNOWLEDGE, IncidentStatus.ACKNOWLEDGED,
                IncidentAction.ASSIGN, IncidentStatus.ASSIGNED));
    }

    @Override
    public boolean isEditable() {
        return true;
    }
}
