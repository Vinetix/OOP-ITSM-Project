package com.itsm.incident.state;

import java.util.Map;

/** Waiting for the reporter to answer the technician's question. */
final class AwaitingInfoState extends AbstractIncidentState {

    AwaitingInfoState() {
        super(IncidentStatus.AWAITING_INFO, Map.of(
                IncidentAction.PROVIDE_INFO, IncidentStatus.IN_PROGRESS,
                IncidentAction.ASSIGN, IncidentStatus.ASSIGNED));
    }

    @Override
    public boolean isEditable() {
        return true;
    }
}
