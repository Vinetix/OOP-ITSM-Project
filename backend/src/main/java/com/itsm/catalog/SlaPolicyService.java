package com.itsm.catalog;

import com.itsm.catalog.dto.EffectiveSla;
import com.itsm.catalog.dto.SlaPolicyCreateRequest;
import com.itsm.catalog.dto.SlaPolicyResponse;
import com.itsm.catalog.dto.SlaPolicyUpdateRequest;
import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.common.exception.DuplicateResourceException;
import com.itsm.common.exception.ResourceNotFoundException;
import com.itsm.incident.priority.Priority;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SlaPolicyService {

    private final SlaPolicyRepository slaPolicyRepository;
    private final ServiceCatalogService serviceCatalogService;

    // ---------------- the core rule: which SLA applies? ----------------

    /**
     * Resolution order: service-specific override first, then the default for the priority.
     * Called when an incident is created or its priority changes (Phase 3/4).
     */
    @Transactional(readOnly = true)
    public EffectiveSla resolve(ITService service, Priority priority) {
        if (service != null) {
            var override = slaPolicyRepository.findByServiceIdAndPriority(service.getId(), priority);
            if (override.isPresent()) {
                return EffectiveSla.from(override.get());
            }
        }
        return slaPolicyRepository.findByServiceIsNullAndPriority(priority)
                .map(EffectiveSla::from)
                .orElseThrow(() -> new SlaConfigurationMissingException(priority));
    }

    /** Admin preview: "what SLA would an incident on this service with this priority get?" */
    @Transactional(readOnly = true)
    public EffectiveSla preview(Long serviceId, Priority priority) {
        ITService service = serviceId == null ? null : serviceCatalogService.find(serviceId);
        return resolve(service, priority);
    }

    // ---------------- admin CRUD ----------------

    /** All policies (defaults first, then overrides grouped by service), or only one service's overrides. */
    @Transactional(readOnly = true)
    public List<SlaPolicyResponse> list(Long serviceId) {
        List<SlaPolicy> policies = serviceId != null
                ? slaPolicyRepository.findAllByServiceIdOrderByPriorityAsc(serviceId)
                : slaPolicyRepository.findAll();
        return policies.stream()
                .sorted(Comparator
                        .comparing((SlaPolicy p) -> p.isDefaultPolicy() ? "" : p.getService().getName())
                        .thenComparing(SlaPolicy::getPriority))
                .map(SlaPolicyResponse::from)
                .toList();
    }

    public SlaPolicyResponse create(SlaPolicyCreateRequest request) {
        ITService service = null;
        boolean exists;
        if (request.serviceId() == null) {
            exists = slaPolicyRepository.existsByServiceIsNullAndPriority(request.priority());
        } else {
            service = serviceCatalogService.find(request.serviceId());
            exists = slaPolicyRepository.existsByServiceIdAndPriority(service.getId(), request.priority());
        }
        if (exists) {
            String scope = service == null ? "default" : "service '" + service.getName() + "'";
            throw new DuplicateResourceException("An SLA policy for " + request.priority() + " already exists for "
                    + scope + ". Edit it instead.");
        }
        SlaPolicy saved = slaPolicyRepository.save(
                new SlaPolicy(service, request.priority(), request.responseMinutes(), request.resolutionMinutes()));
        return SlaPolicyResponse.from(saved);
    }

    public SlaPolicyResponse update(Long id, SlaPolicyUpdateRequest request) {
        SlaPolicy policy = find(id);
        policy.updateTargets(request.responseMinutes(), request.resolutionMinutes());
        return SlaPolicyResponse.from(policy);
    }

    /** Service overrides can be removed (the default then applies). Defaults must always exist. */
    public void delete(Long id) {
        SlaPolicy policy = find(id);
        if (policy.isDefaultPolicy()) {
            throw new BusinessRuleViolationException(
                    "Default SLA policies cannot be deleted, because every incident needs an SLA. Edit it instead.");
        }
        slaPolicyRepository.delete(policy);
    }

    private SlaPolicy find(Long id) {
        return slaPolicyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("SLA policy", id));
    }
}
