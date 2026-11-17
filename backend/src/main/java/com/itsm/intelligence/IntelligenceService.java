package com.itsm.intelligence;

import com.itsm.catalog.ITService;
import com.itsm.catalog.ITServiceRepository;
import com.itsm.common.exception.ResourceNotFoundException;
import com.itsm.common.exception.UnauthorizedOperationException;
import com.itsm.incident.Incident;
import com.itsm.incident.IncidentAccessPolicy;
import com.itsm.incident.IncidentRepository;
import com.itsm.intelligence.dto.AiStatusResponse;
import com.itsm.intelligence.dto.CategorySuggestionResponse;
import com.itsm.intelligence.dto.SimilarIncidentResponse;
import com.itsm.intelligence.dto.TextCheckRequest;
import com.itsm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class IntelligenceService {

    private final DuplicateDetector duplicateDetector;
    private final CategorySuggestionService categorySuggestionService;
    private final IncidentRepository incidentRepository;
    private final ITServiceRepository serviceRepository;
    private final IncidentAccessPolicy accessPolicy;

    /** Before reporting: similar recent incidents (shows only number, title, status, service, age). */
    public List<SimilarIncidentResponse> checkDuplicates(TextCheckRequest request) {
        ITService service = request.serviceId() == null ? null : serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service", request.serviceId()));
        return duplicateDetector.findSimilar(request.title(), request.description(), service,
                service == null ? null : service.getDefaultCategory(), null);
    }

    /** Similar incidents to an existing one: admin or its assigned technician. */
    public List<SimilarIncidentResponse> similarTo(Long incidentId, UserPrincipal actor) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", incidentId));
        if (!accessPolicy.canManageDuplicates(incident, actor)) {
            throw new UnauthorizedOperationException("Only an admin or the assigned technician can see similar incidents");
        }
        return duplicateDetector.findSimilar(incident.getTitle(), incident.getDescription(), incident.getService(),
                incident.getCategory(), incident.getId());
    }

    /** AI suggestion first (when available), keyword suggestions as the safety net. */
    public List<CategorySuggestionResponse> suggestCategories(TextCheckRequest request) {
        return categorySuggestionService.suggest(request.title(), request.description());
    }

    public AiStatusResponse aiStatus() {
        return categorySuggestionService.status();
    }
}
