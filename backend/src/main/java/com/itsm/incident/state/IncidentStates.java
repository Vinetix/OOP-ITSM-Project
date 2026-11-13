package com.itsm.incident.state;

import java.util.EnumMap;
import java.util.Map;

/**
 * Registry of the state objects, one shared instance per status (states are stateless,
 * so all incidents in the same status can share one object).
 * To add a lifecycle step: create one state class, register it here, add the enum value.
 */
final class IncidentStates {

    private static final Map<IncidentStatus, IncidentState> STATES = new EnumMap<>(IncidentStatus.class);

    static {
        register(new NewState());
        register(new ClassifiedState());
        register(new AssignedState());
        register(new AcknowledgedState());
        register(new InProgressState());
        register(new AwaitingInfoState());
        register(new ResolvedState());
        register(new VerifiedState());
        register(new ClosedState());
    }

    private IncidentStates() {
    }

    private static void register(IncidentState state) {
        STATES.put(state.status(), state);
    }

    static IncidentState of(IncidentStatus status) {
        return STATES.get(status);
    }
}
