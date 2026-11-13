package com.itsm.incident.priority;

import com.itsm.catalog.BusinessCriticality;

/** Everything a priority strategy may look at. */
public record PriorityInput(
        Impact impact,
        Urgency urgency,
        BusinessCriticality criticality,
        int affectedUsers
) {
}
