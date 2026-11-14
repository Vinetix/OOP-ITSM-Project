package com.itsm.audit;

import com.itsm.audit.dto.AuditEntryResponse;
import com.itsm.common.exception.InvalidRequestException;
import com.itsm.common.web.PageResponse;
import com.itsm.incident.IncidentService;
import com.itsm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Stream;

/** Read side of the audit trail. Rows are only ever written by AuditEventListener. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;
    private final IncidentService incidentService;

    /** Same visibility as the incident itself: reporter, assigned technician or admin (else 403/404). */
    public List<AuditEntryResponse> history(Long incidentId, UserPrincipal actor) {
        incidentService.get(incidentId, actor); // reuses the incident's access check
        return repository.findByIncidentIdOrderByOccurredAtAscIdAsc(incidentId).stream()
                .map(AuditEntryResponse::from)
                .toList();
    }

    /** Admin search. Dates are whole days in UTC; "to" is inclusive. */
    public PageResponse<AuditEntryResponse> search(String incidentNumber, Long actorId, Boolean systemOnly,
                                                   AuditAction action, LocalDate from, LocalDate to,
                                                   Pageable pageable) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new InvalidRequestException("'to' must not be before 'from'");
        }
        Specification<AuditLog> spec = Stream.of(
                        AuditSpecifications.incidentNumber(incidentNumber),
                        AuditSpecifications.actor(actorId),
                        AuditSpecifications.systemOnly(systemOnly),
                        AuditSpecifications.action(action),
                        AuditSpecifications.from(from == null ? null : from.atStartOfDay().toInstant(ZoneOffset.UTC)),
                        AuditSpecifications.before(to == null ? null : to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)))
                .filter(s -> s != null)
                .reduce(Specification::and)
                .orElse((root, query, cb) -> cb.conjunction());
        return PageResponse.from(repository.findAll(spec, pageable).map(AuditEntryResponse::from));
    }
}
