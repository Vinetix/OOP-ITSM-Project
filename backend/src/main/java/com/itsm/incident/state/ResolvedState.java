package com.itsm.incident.state;

import java.util.Map;

/** Fix provided. The reporter confirms it (VERIFY) or rejects it (REOPEN). */
final class ResolvedState extends AbstractIncidentState {

    ResolvedState() {
        super(IncidentStatus.RESOLVED, Map.of(
                IncidentAction.VERIFY, IncidentStatus.VERIFIED,
                IncidentAction.REOPEN, IncidentStatus.IN_PROGRESS));
    }
}
