package com.itsm.audit;

import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

/**
 * One line of an incident's history. Write-once: no setters, and Hibernate's @Immutable ignores any
 * attempted update. The incident number and the actor's name and role are stored as copies, so the
 * history stays correct even if a user is renamed later. A null actorId means the system acted.
 *
 * Doesn't extend BaseEntity on purpose: a record that never changes needs no version or updatedAt.
 */
@Getter
@Entity
@Immutable
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_incident", columnList = "incidentId"),
        @Index(name = "idx_audit_occurred", columnList = "occurredAt")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLog {

    public static final String SYSTEM_ACTOR = "System";
    static final int MAX_DETAILS = 1000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant occurredAt;

    @Column(nullable = false)
    private Long incidentId;

    @Column(nullable = false, length = 20)
    private String incidentNumber;

    private Long actorId;

    @Column(nullable = false, length = 100)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role actorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private IncidentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private IncidentStatus toStatus;

    @Column(length = MAX_DETAILS)
    private String details;

    public AuditLog(Instant occurredAt, Long incidentId, String incidentNumber, Long actorId, String actorName,
                    Role actorRole, AuditAction action, IncidentStatus fromStatus, IncidentStatus toStatus,
                    String details) {
        this.occurredAt = occurredAt;
        this.incidentId = incidentId;
        this.incidentNumber = incidentNumber;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.action = action;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.details = details == null || details.length() <= MAX_DETAILS
                ? details : details.substring(0, MAX_DETAILS - 1) + "…";
    }

    public boolean isSystemAction() {
        return actorId == null;
    }
}
