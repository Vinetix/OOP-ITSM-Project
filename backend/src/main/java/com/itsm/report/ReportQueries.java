package com.itsm.report;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/** Read-only queries for the reports. */
@Repository
@RequiredArgsConstructor
public class ReportQueries {

    private final EntityManager entityManager;

    /** Facts for incidents reported in [from, before); either bound may be null (open-ended). */
    public List<IncidentFact> incidentFacts(Instant from, Instant before) {
        StringBuilder jpql = new StringBuilder("""
                select new com.itsm.report.IncidentFact(
                    i.id, i.status, i.priority, c.code, c.name, s.name, t.id, t.fullName,
                    i.sla.slaStartedAt, i.sla.respondedAt, i.sla.resolvedAt,
                    i.sla.responseBreached, i.sla.resolutionBreached, i.escalationLevel, i.feedbackRating)
                from Incident i
                join i.service s
                left join i.category c
                left join i.assignedTechnician t
                where i.sla.slaStartedAt is not null
                """);
        if (from != null) {
            jpql.append(" and i.sla.slaStartedAt >= :from");
        }
        if (before != null) {
            jpql.append(" and i.sla.slaStartedAt < :before");
        }
        TypedQuery<IncidentFact> query = entityManager.createQuery(jpql.toString(), IncidentFact.class);
        if (from != null) {
            query.setParameter("from", from);
        }
        if (before != null) {
            query.setParameter("before", before);
        }
        return query.getResultList();
    }
}
