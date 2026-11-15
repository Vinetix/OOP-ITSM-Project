package com.itsm.incident.sla;

import com.itsm.incident.Incident;
import com.itsm.incident.priority.Priority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

/**
 * A recorded SLA violation: one row per missed deadline (an incident can have one RESPONSE and one
 * RESOLUTION violation). Write-once. Priority, service and technician are copied as they were at the
 * moment of the breach, so reports stay correct even if the incident changes later.
 */
@Getter
@Entity
@Immutable
@Table(name = "sla_violations", indexes = @Index(name = "idx_violation_detected", columnList = "detectedAt"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SlaViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(nullable = false, length = 20)
    private String incidentNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private SlaTarget target;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private Priority priority;

    @Column(nullable = false)
    private int targetMinutes;

    @Column(nullable = false)
    private Instant dueAt;

    /** When the system recorded the breach (the deadline itself is dueAt). */
    @Column(nullable = false)
    private Instant detectedAt;

    @Column(nullable = false, length = 100)
    private String serviceName;

    private Long technicianId;

    @Column(length = 100)
    private String technicianName;

    public SlaViolation(Incident incident, SlaTarget target, Instant detectedAt) {
        this.incident = incident;
        this.incidentNumber = incident.getNumber();
        this.target = target;
        this.priority = incident.getPriority();
        this.targetMinutes = incident.getSla().targetMinutes(target);
        this.dueAt = incident.getSla().dueAt(target);
        this.detectedAt = detectedAt;
        this.serviceName = incident.getService().getName();
        if (incident.getAssignedTechnician() != null) {
            this.technicianId = incident.getAssignedTechnician().getId();
            this.technicianName = incident.getAssignedTechnician().getFullName();
        }
    }
}
