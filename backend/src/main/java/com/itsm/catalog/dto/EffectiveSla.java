package com.itsm.catalog.dto;

import com.itsm.catalog.SlaPolicy;
import com.itsm.incident.priority.Priority;

/**
 * The SLA that actually applies to an incident: the service override if one exists,
 * otherwise the default. Incidents copy these numbers when created (Phase 3), so later
 * policy edits never change the deadlines of incidents that already exist.
 */
public record EffectiveSla(
        Long policyId,
        String scope,
        Priority priority,
        int responseMinutes,
        int resolutionMinutes
) {

    public static EffectiveSla from(SlaPolicy p) {
        return new EffectiveSla(p.getId(),
                p.isDefaultPolicy() ? SlaPolicyResponse.SCOPE_DEFAULT : SlaPolicyResponse.SCOPE_SERVICE,
                p.getPriority(), p.getResponseMinutes(), p.getResolutionMinutes());
    }
}
