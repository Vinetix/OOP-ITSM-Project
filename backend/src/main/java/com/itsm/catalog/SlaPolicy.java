package com.itsm.catalog;

import com.itsm.common.domain.BaseEntity;
import com.itsm.common.exception.InvalidRequestException;
import com.itsm.incident.priority.Priority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;

/**
 * Response and resolution targets for one priority.
 * service == null  -> organisation-wide DEFAULT policy for that priority.
 * service != null  -> override for that specific service (e.g. tighter targets for Payment Gateway).
 */
@Getter
@Entity
@Table(name = "sla_policies")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SlaPolicy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private ITService service;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private Priority priority;

    /** Minutes until a technician must acknowledge the incident. */
    @Column(nullable = false)
    private int responseMinutes;

    /** Minutes until the incident must be resolved. */
    @Column(nullable = false)
    private int resolutionMinutes;

    public SlaPolicy(ITService service, Priority priority, int responseMinutes, int resolutionMinutes) {
        this.service = service;
        this.priority = priority;
        applyTargets(responseMinutes, resolutionMinutes);
    }

    public void updateTargets(int responseMinutes, int resolutionMinutes) {
        applyTargets(responseMinutes, resolutionMinutes);
    }

    public boolean isDefaultPolicy() {
        return service == null;
    }

    public Duration responseTime() {
        return Duration.ofMinutes(responseMinutes);
    }

    public Duration resolutionTime() {
        return Duration.ofMinutes(resolutionMinutes);
    }

    private void applyTargets(int responseMinutes, int resolutionMinutes) {
        if (responseMinutes < 1 || resolutionMinutes < 1) {
            throw new InvalidRequestException("SLA targets must be at least 1 minute");
        }
        if (resolutionMinutes < responseMinutes) {
            throw new InvalidRequestException("Resolution target cannot be shorter than the response target");
        }
        this.responseMinutes = responseMinutes;
        this.resolutionMinutes = resolutionMinutes;
    }
}
