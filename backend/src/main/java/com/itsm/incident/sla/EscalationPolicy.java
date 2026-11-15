package com.itsm.incident.sla;

import com.itsm.incident.Incident;
import com.itsm.incident.priority.Priority;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * When does an unacknowledged incident move up the chain? Measured against the response target T:
 *
 *   level 1 at 1.0 x T  (deadline missed)  -> remind the assigned technician
 *   level 2 at 1.5 x T                      -> alert available senior technicians (team leads)
 *   level 3 at 2.0 x T                      -> alert the admins (IT manager)
 *
 * Only P1/P2 incidents that are ASSIGNED but not yet acknowledged are escalated. Unassigned ones have
 * nobody to chase; they get SLA warning and breach alerts sent to the admins instead.
 */
@Component
public class EscalationPolicy {

    public static final int MAX_LEVEL = 3;
    static final double[] THRESHOLDS = {1.0, 1.5, 2.0};

    /** The level this incident should be at now (0 = none). */
    public int levelDue(Incident incident, Instant now) {
        if (!incident.isAwaitingAcknowledgement() || !isEscalated(incident.getPriority())) {
            return 0;
        }
        double elapsed = incident.getSla().responseElapsedFraction(now);
        int level = 0;
        for (double threshold : THRESHOLDS) {
            if (elapsed >= threshold) {
                level++;
            }
        }
        return level;
    }

    public static boolean isEscalated(Priority priority) {
        return priority == Priority.P1 || priority == Priority.P2;
    }

    public static String describe(int level) {
        return switch (level) {
            case 1 -> "assigned technician reminded";
            case 2 -> "senior technicians alerted";
            case 3 -> "admins alerted";
            default -> "not escalated";
        };
    }
}
