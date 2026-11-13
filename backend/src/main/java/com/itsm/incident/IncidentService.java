package com.itsm.incident;

import com.itsm.catalog.Category;
import com.itsm.catalog.CategoryService;
import com.itsm.catalog.ITService;
import com.itsm.catalog.ServiceCatalogService;
import com.itsm.catalog.SlaPolicyService;
import com.itsm.catalog.dto.EffectiveSla;
import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.common.exception.ResourceNotFoundException;
import com.itsm.common.exception.UnauthorizedOperationException;
import com.itsm.common.web.PageResponse;
import com.itsm.incident.assignment.TechnicianWorkloadService;
import com.itsm.incident.dto.CreateIncidentRequest;
import com.itsm.incident.dto.IncidentResponse;
import com.itsm.incident.dto.IncidentSummaryResponse;
import com.itsm.incident.dto.ResolveIncidentRequest;
import com.itsm.incident.dto.UpdateIncidentRequest;
import com.itsm.incident.dto.VerifyIncidentRequest;
import com.itsm.incident.event.IncidentAssignedEvent;
import com.itsm.incident.event.IncidentCreatedEvent;
import com.itsm.incident.event.IncidentDetailsUpdatedEvent;
import com.itsm.incident.event.IncidentEvent;
import com.itsm.incident.event.IncidentNoteAddedEvent;
import com.itsm.incident.event.IncidentPriorityChangedEvent;
import com.itsm.incident.event.IncidentStatusChangedEvent;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.priority.PriorityInput;
import com.itsm.incident.priority.PriorityResult;
import com.itsm.incident.priority.PriorityStrategy;
import com.itsm.incident.state.IncidentAction;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.security.UserPrincipal;
import com.itsm.user.Technician;
import com.itsm.user.TechnicianRepository;
import com.itsm.user.User;
import com.itsm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.function.BiConsumer;

/**
 * Orchestrates incident use cases. The pattern for every action is the same:
 *   1. load the incident and check WHO may do it (IncidentAccessPolicy)
 *   2. call the domain method; the incident's State checks WHEN it is allowed
 *   3. publish an event (Observer) so notifications/audit can react
 *   4. return a DTO
 */
@Service
@Transactional
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;
    private final ServiceCatalogService serviceCatalogService;
    private final CategoryService categoryService;
    private final SlaPolicyService slaPolicyService;
    private final PriorityStrategy priorityStrategy;
    private final TechnicianWorkloadService workloadService;
    private final IncidentAccessPolicy accessPolicy;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    // =============== report (create + classify + prioritize + SLA) ===============

    public IncidentResponse report(CreateIncidentRequest request, UserPrincipal actor) {
        Instant now = clock.instant();
        User reporter = loadUser(actor.getId());
        ITService service = activeService(request.serviceId());
        Category category = resolveCategory(request.categoryId(), service);

        Incident incident = new Incident(reporter, service, request.title(), request.description(),
                request.impact(), request.urgency(), request.affectedUsers());

        PriorityResult priority = priorityStrategy.calculate(priorityInputOf(incident));
        EffectiveSla sla = slaPolicyService.resolve(service, priority.priority());
        incident.classify(category, priority, sla, now);
        incidentRepository.save(incident);

        publish(new IncidentCreatedEvent(incident.getId(), actor.getId(), now, incident.getNumber(), incident.getTitle()));
        publish(new IncidentStatusChangedEvent(incident.getId(), null, now,
                IncidentStatus.NEW, IncidentStatus.CLASSIFIED, IncidentAction.CLASSIFY,
                "Classified as " + category.getCode() + ". " + priority.explanation()
                        + ". SLA (" + sla.scope() + "): respond in " + sla.responseMinutes()
                        + " min, resolve in " + sla.resolutionMinutes() + " min"));
        return toResponse(incident, actor, now);
    }

    // =============== queries ===============

    @Transactional(readOnly = true)
    public IncidentResponse get(Long id, UserPrincipal actor) {
        return toResponse(loadVisible(id, actor), actor, clock.instant());
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentSummaryResponse> list(Collection<IncidentStatus> statuses, Pageable pageable,
                                                      UserPrincipal actor) {
        Specification<Incident> spec = IncidentSpecifications.visibleTo(actor);
        if (statuses != null && !statuses.isEmpty()) {
            spec = spec.and(IncidentSpecifications.hasStatusIn(statuses));
        }
        Instant now = clock.instant();
        return PageResponse.from(incidentRepository.findAll(spec, pageable)
                .map(incident -> IncidentSummaryResponse.from(incident, now)));
    }

    // =============== update details (recalculates priority + SLA) ===============

    public IncidentResponse update(Long id, UpdateIncidentRequest request, UserPrincipal actor) {
        Incident incident = loadVisible(id, actor);
        if (!accessPolicy.canEditDetails(incident, actor)) {
            throw new UnauthorizedOperationException("Only the reporter or an administrator can edit this incident");
        }
        ITService service = request.serviceId() == null ? null : activeService(request.serviceId());
        Category category = request.categoryId() == null ? null : activeCategory(request.categoryId());

        List<String> changed = incident.updateDetails(request.title(), request.description(), service, category,
                request.impact(), request.urgency(), request.affectedUsers());

        Instant now = clock.instant();
        if (!changed.isEmpty()) {
            Priority oldPriority = incident.getPriority();
            PriorityResult recalculated = priorityStrategy.calculate(priorityInputOf(incident));
            incident.reprioritize(recalculated, slaPolicyService.resolve(incident.getService(), recalculated.priority()));

            publish(new IncidentDetailsUpdatedEvent(id, actor.getId(), now, changed));
            if (oldPriority != recalculated.priority()) {
                publish(new IncidentPriorityChangedEvent(id, actor.getId(), now,
                        oldPriority, recalculated.priority(), recalculated.explanation()));
            }
        }
        return toResponse(incident, actor, now);
    }

    // =============== lifecycle actions ===============

    public IncidentResponse assign(Long id, Long technicianId, UserPrincipal actor) {
        Incident incident = loadForAction(id, IncidentAction.ASSIGN, actor);
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));
        workloadService.ensureCanAccept(technician);

        Long previousId = incident.getAssignedTechnician() == null ? null : incident.getAssignedTechnician().getId();
        IncidentStatus from = incident.getStatus();
        Instant now = clock.instant();
        incident.assignTo(technician, now);

        publish(new IncidentAssignedEvent(id, actor.getId(), now, technician.getId(), previousId));
        publishStatusChange(incident, from, IncidentAction.ASSIGN, actor.getId(), now,
                (previousId == null ? "Assigned to " : "Re-assigned to ") + technician.getFullName());
        return toResponse(incident, actor, now);
    }

    public IncidentResponse acknowledge(Long id, UserPrincipal actor) {
        return transition(id, IncidentAction.ACKNOWLEDGE, actor,
                (incident, now) -> incident.acknowledge(now), "Technician acknowledged the incident");
    }

    public IncidentResponse start(Long id, UserPrincipal actor) {
        return transition(id, IncidentAction.START, actor,
                (incident, now) -> incident.start(), "Investigation started");
    }

    public IncidentResponse requestInfo(Long id, String question, UserPrincipal actor) {
        User technician = loadUser(actor.getId());
        return transition(id, IncidentAction.REQUEST_INFO, actor,
                (incident, now) -> incident.requestInfo(technician, question), "Information requested: " + preview(question));
    }

    public IncidentResponse provideInfo(Long id, String answer, UserPrincipal actor) {
        User reporter = loadUser(actor.getId());
        return transition(id, IncidentAction.PROVIDE_INFO, actor,
                (incident, now) -> incident.provideInfo(reporter, answer), "Information provided: " + preview(answer));
    }

    public IncidentResponse resolve(Long id, ResolveIncidentRequest request, UserPrincipal actor) {
        return transition(id, IncidentAction.RESOLVE, actor,
                (incident, now) -> incident.resolve(request.resolutionSummary(), request.rootCause(), now),
                "Resolved: " + preview(request.resolutionSummary()));
    }

    public IncidentResponse verify(Long id, VerifyIncidentRequest request, UserPrincipal actor) {
        return transition(id, IncidentAction.VERIFY, actor,
                (incident, now) -> incident.verify(request.rating(), request.feedback(), now),
                "Resolution verified by reporter" + (request.rating() == null ? "" : " (rating " + request.rating() + "/5)"));
    }

    public IncidentResponse reopen(Long id, String reason, UserPrincipal actor) {
        User reporter = loadUser(actor.getId());
        return transition(id, IncidentAction.REOPEN, actor,
                (incident, now) -> incident.reopen(reporter, reason), "Reopened: " + preview(reason));
    }

    public IncidentResponse close(Long id, String closureNote, UserPrincipal actor) {
        return transition(id, IncidentAction.CLOSE, actor,
                (incident, now) -> incident.close(closureNote, now), "Incident closed");
    }

    public IncidentResponse addNote(Long id, String text, UserPrincipal actor) {
        Incident incident = loadVisible(id, actor);
        if (!accessPolicy.canAddNote(incident, actor)) {
            throw new UnauthorizedOperationException("You can't add notes to this incident");
        }
        NoteType type = incident.isAssignedTo(actor.getId()) ? NoteType.WORK_NOTE : NoteType.COMMENT;
        incident.addNote(loadUser(actor.getId()), type, text);
        Instant now = clock.instant();
        publish(new IncidentNoteAddedEvent(id, actor.getId(), now, type));
        return toResponse(incident, actor, now);
    }

    // =============== helpers ===============

    /** Template for the simple lifecycle actions: authorize, apply, publish, respond. */
    private IncidentResponse transition(Long id, IncidentAction action, UserPrincipal actor,
                                        BiConsumer<Incident, Instant> change, String details) {
        Incident incident = loadForAction(id, action, actor);
        IncidentStatus from = incident.getStatus();
        Instant now = clock.instant();
        change.accept(incident, now); // the State throws InvalidStateTransitionException if not allowed
        publishStatusChange(incident, from, action, actor.getId(), now, details);
        return toResponse(incident, actor, now);
    }

    private Incident loadVisible(Long id, UserPrincipal actor) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", id));
        if (!accessPolicy.canView(incident, actor)) {
            throw new UnauthorizedOperationException("You don't have access to this incident");
        }
        return incident;
    }

    private Incident loadForAction(Long id, IncidentAction action, UserPrincipal actor) {
        Incident incident = loadVisible(id, actor);
        if (!accessPolicy.canPerform(action, incident, actor)) {
            throw new UnauthorizedOperationException("You are not allowed to " + action + " this incident");
        }
        return incident;
    }

    private User loadUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    private ITService activeService(Long serviceId) {
        ITService service = serviceCatalogService.find(serviceId);
        if (!service.isActive()) {
            throw new BusinessRuleViolationException("Service '" + service.getName() + "' is not active");
        }
        return service;
    }

    private Category activeCategory(Long categoryId) {
        Category category = categoryService.find(categoryId);
        if (!category.isActive()) {
            throw new BusinessRuleViolationException("Category '" + category.getName() + "' is not active");
        }
        return category;
    }

    /** Explicit category if given, otherwise the service's default category. */
    private Category resolveCategory(Long categoryId, ITService service) {
        if (categoryId != null) {
            return activeCategory(categoryId);
        }
        Category fallback = service.getDefaultCategory();
        if (fallback == null || !fallback.isActive()) {
            throw new BusinessRuleViolationException(
                    "Please choose a category: service '" + service.getName() + "' has no active default category");
        }
        return fallback;
    }

    private PriorityInput priorityInputOf(Incident incident) {
        return new PriorityInput(incident.getImpact(), incident.getUrgency(),
                incident.getService().getCriticality(), incident.getAffectedUsers());
    }

    private void publishStatusChange(Incident incident, IncidentStatus from, IncidentAction action,
                                     Long actorId, Instant now, String details) {
        publish(new IncidentStatusChangedEvent(incident.getId(), actorId, now, from, incident.getStatus(), action, details));
    }

    private void publish(IncidentEvent event) {
        eventPublisher.publishEvent(event);
    }

    private IncidentResponse toResponse(Incident incident, UserPrincipal actor, Instant now) {
        boolean canEdit = accessPolicy.canEditDetails(incident, actor) && incident.state().isEditable();
        boolean canAddNote = accessPolicy.canAddNote(incident, actor) && incident.state().acceptsNotes();
        return IncidentResponse.from(incident, accessPolicy.availableActions(incident, actor), canEdit, canAddNote, now);
    }

    private static String preview(String text) {
        String trimmed = text.trim();
        return trimmed.length() <= 80 ? trimmed : trimmed.substring(0, 77) + "...";
    }
}
