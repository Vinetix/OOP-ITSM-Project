package com.itsm.incident.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.itsm.incident.sla.SlaStatus;
import com.itsm.incident.sla.SlaTracking;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SlaView(
        String scope,
        int responseTargetMinutes,
        int resolutionTargetMinutes,
        Instant startedAt,
        Instant responseDueAt,
        Instant resolutionDueAt,
        Instant respondedAt,
        Instant resolvedAt,
        boolean responseBreached,
        boolean resolutionBreached,
        SlaStatus status
) {

    public static SlaView from(SlaTracking sla, Instant now) {
        if (sla == null) {
            return null;
        }
        return new SlaView(sla.getSlaScope(), sla.getResponseTargetMinutes(), sla.getResolutionTargetMinutes(),
                sla.getSlaStartedAt(), sla.getResponseDueAt(), sla.getResolutionDueAt(),
                sla.getRespondedAt(), sla.getResolvedAt(),
                sla.isResponseBreached(), sla.isResolutionBreached(), sla.statusAt(now));
    }
}
