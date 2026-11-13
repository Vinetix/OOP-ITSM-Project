package com.itsm.incident.state;

import java.util.Map;

/** Under investigation. The technician can ask the reporter for information or resolve it. */
final class InProgressState extends AbstractIncidentState {

    InProgressState() {
        super(IncidentStatus.IN_PROGRESS, Map.of(
                IncidentAction.REQUEST_INFO, IncidentStatus.AWAITING_INFO,
                IncidentAction.RESOLVE, IncidentStatus.RESOLVED,
                IncidentAction.ASSIGN, IncidentStatus.ASSIGNED));
    }

    @Override
    public boolean isEditable() {
        return true;
    }
}
