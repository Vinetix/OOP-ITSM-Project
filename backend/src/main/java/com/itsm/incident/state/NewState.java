package com.itsm.incident.state;

import java.util.Map;

/** Just reported. The system classifies it immediately (category, priority, SLA). */
final class NewState extends AbstractIncidentState {

    NewState() {
        super(IncidentStatus.NEW, Map.of(IncidentAction.CLASSIFY, IncidentStatus.CLASSIFIED));
    }

    @Override
    public boolean isEditable() {
        return true;
    }
}
