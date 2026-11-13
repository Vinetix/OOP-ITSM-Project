package com.itsm.incident.state;

import java.util.Map;

/** The technician has acknowledged it (response SLA met or missed is now recorded). */
final class AcknowledgedState extends AbstractIncidentState {

    AcknowledgedState() {
        super(IncidentStatus.ACKNOWLEDGED, Map.of(
                IncidentAction.START, IncidentStatus.IN_PROGRESS,
                IncidentAction.ASSIGN, IncidentStatus.ASSIGNED));
    }

    @Override
    public boolean isEditable() {
        return true;
    }
}
