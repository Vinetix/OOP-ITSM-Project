package com.itsm.incident.sla;

import com.itsm.common.web.PageResponse;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.dto.SlaViolationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class SlaService {

    private final SlaViolationRepository violationRepository;

    @Transactional(readOnly = true)
    public PageResponse<SlaViolationResponse> violations(SlaTarget target, Priority priority, String incidentNumber,
                                                         Pageable pageable) {
        Specification<SlaViolation> spec = Stream.of(
                        SlaViolationSpecifications.target(target),
                        SlaViolationSpecifications.priority(priority),
                        SlaViolationSpecifications.incidentNumber(incidentNumber))
                .filter(Objects::nonNull)
                .reduce(Specification::and)
                .orElse((root, query, cb) -> cb.conjunction());
        return PageResponse.from(violationRepository.findAll(spec, pageable).map(SlaViolationResponse::from));
    }
}
