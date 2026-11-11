package com.itsm.catalog.dto;

import com.itsm.catalog.SlaPolicy;
import com.itsm.incident.priority.Priority;

public record SlaPolicyResponse(
        Long id,
        String scope,
        ServiceSummary service,
        Priority priority,
        int responseMinutes,
        int resolutionMinutes
) {

    public static final String SCOPE_DEFAULT = "DEFAULT";
    public static final String SCOPE_SERVICE = "SERVICE";

    public static SlaPolicyResponse from(SlaPolicy p) {
        return new SlaPolicyResponse(p.getId(),
                p.isDefaultPolicy() ? SCOPE_DEFAULT : SCOPE_SERVICE,
                ServiceSummary.from(p.getService()),
                p.getPriority(), p.getResponseMinutes(), p.getResolutionMinutes());
    }
}
