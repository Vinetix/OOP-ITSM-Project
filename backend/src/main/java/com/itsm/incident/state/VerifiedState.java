package com.itsm.incident.state;

import java.util.Map;

/** The reporter confirmed the fix. Ready to close. */
final class VerifiedState extends AbstractIncidentState {

    VerifiedState() {
        super(IncidentStatus.VERIFIED, Map.of(IncidentAction.CLOSE, IncidentStatus.CLOSED));
    }
}
