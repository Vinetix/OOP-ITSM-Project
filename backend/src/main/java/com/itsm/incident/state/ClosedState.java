package com.itsm.incident.state;

import java.util.Map;

/** Final state: nothing can happen any more, not even new notes. */
final class ClosedState extends AbstractIncidentState {

    ClosedState() {
        super(IncidentStatus.CLOSED, Map.of());
    }

    @Override
    public boolean acceptsNotes() {
        return false;
    }
}
