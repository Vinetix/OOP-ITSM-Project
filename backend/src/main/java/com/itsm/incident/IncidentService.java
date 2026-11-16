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
import com.itsm.incident.assignment.AssignmentProposal;
import com.itsm.incident.assignment.AssignmentService;
import com.itsm.incident.assignment.NoEligibleTechnicianException;
import com.itsm.incident.assignment.TechnicianWorkloadService;
import com.itsm.incident.assignment.dto.RecommendationResponse;
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
import com.itsm.common.exception.InvalidRequestException;
import com.itsm.incident.event.IncidentDuplicateLinkedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.time.ZoneId;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.function.BiConsumer;

/**
 * Orchestrates incident use cases. The pattern for every action is the same:
 *   1. load the incident and check WHO may do it (IncidentAccessPolicy)
 *   2. call the domain method; the incident's State checks WHEN it is allowed
 *   3. publish an event (Observer) so notifications/audit can react
 *   4. return a DTO
 *
 * Assignment can be manual (admin picks a technician) or automatic (the active AssignmentStrategy
 * picks one, on report or on request). Both go through applyAssignment(), so the same checks and
 * events apply. Automatic assignment on report is done by the system (actor id null).
 */
@Slf4j
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
    private final AssignmentService assignmentService;

    @Value("${app.reports.zone:Asia/Kolkata}")
    private String reportsZoneName;
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

        if (assignmentService.isAutoAssignOnReport()) {
            AssignmentProposal proposal = assignmentService.propose(incident);
            if (proposal.hasCandidate()) {
                applyAssignment(incident, proposal.technician(), null, now, proposal.describe());
            } else {
                log.info("{} stays CLASSIFIED: {}", incident.getNumber(), proposal.noCandidateReason());
            }
        }
        return toResponse(incident, actor, now);
    }

    // =============== queries ===============

    @Transactional(readOnly = true)
    public IncidentResponse get(Long id, UserPrincipal actor) {
        return toResponse(loadVisible(id, actor), actor, clock.instant());
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentSummaryResponse> list(IncidentSearchCriteria criteria, Pageable pageable,
                                                      UserPrincipal actor) {
        Instant now = clock.instant();
        Instant from = criteria.reportedFrom() == null ? null : criteria.reportedFrom().atStartOfDay(reportsZone()).toInstant();
        Instant before = criteria.reportedTo() == null ? null
                : criteria.reportedTo().plusDays(1).atStartOfDay(reportsZone()).toInstant();
        if (from != null && before != null && !before.isAfter(from)) {
            throw new InvalidRequestException("'reportedTo' must not be before 'reportedFrom'");
        }
        Specification<Incident> spec = Stream.of(
                        IncidentSpecifications.visibleTo(actor),
                        IncidentSpecifications.hasStatusIn(criteria.statuses()),
                        IncidentSpecifications.hasPriorityIn(criteria.priorities()),
                        IncidentSpecifications.inCategory(criteria.categoryId()),
                        IncidentSpecifications.onService(criteria.serviceId()),
                        IncidentSpecifications.assignedTo(criteria.technicianId()),
                        IncidentSpecifications.reportedBy(criteria.reporterId()),
                        IncidentSpecifications.reportedFrom(from),
                        IncidentSpecifications.reportedBefore(before),
                        IncidentSpecifications.hasSlaStatus(criteria.slaStatus(), now),
                        IncidentSpecifications.escalatedOnly(criteria.escalatedOnly()),
                        IncidentSpecifications.matchesText(criteria.text()))
                .filter(Objects::nonNull)
                .reduce(Specification::and)
                .orElseThrow();
        return PageResponse.from(incidentRepository.findAll(spec, byReportedTime(pageable))
                .map(incident -> IncidentSummaryResponse.from(incident, now)));
    }

    /** "createdAt" in a sort means the report time (see Incident.getReportedAt()). */
    private static Pageable byReportedTime(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return pageable;
        }
        Sort sort = Sort.by(pageable.getSort().stream()
                .map(order -> "createdAt".equals(order.getProperty())
                        ? new Sort.Order(order.getDirection(), "sla.slaStartedAt")
                        : order)
                .toList());
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    private ZoneId reportsZone() {
        return ZoneId.of(reportsZoneName);
    }

    // =============== duplicates (Phase 7) ===============

    /** Marks incident {id} as a duplicate of {primaryId}. Admin or the incident's assigned technician. */
    public IncidentResponse linkDuplicate(Long id, Long primaryId, UserPrincipal actor) {
        Incident incident = loadForDuplicates(id, actor);
        Incident primary = incidentRepository.findById(primaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", primaryId));
        incident.markAsDuplicateOf(primary, incidentRepository.existsByDuplicateOfId(incident.getId()));
        Instant now = clock.instant();
        publish(new IncidentDuplicateLinkedEvent(incident.getId(), actor.getId(), now, primary.getId(), primary.getNumber(), true));
        return toResponse(incident, actor, now);
    }

    public IncidentResponse unlinkDuplicate(Long id, UserPrincipal actor) {
        Incident incident = loadForDuplicates(id, actor);
        Incident primary = incident.unlinkDuplicate();
        Instant now = clock.instant();
        publish(new IncidentDuplicateLinkedEvent(incident.getId(), actor.getId(), now, primary.getId(), primary.getNumber(), false));
        return toResponse(incident, actor, now);
    }

    private Incident loadForDuplicates(Long id, UserPrincipal actor) {
        Incident incident = loadVisible(id, actor);
        if (!accessPolicy.canManageDuplicates(incident, actor)) {
            throw new UnauthorizedOperationException("Only an admin or the assigned technician can link duplicates");
        }
        return incident;
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
        Instant now = clock.instant();
        applyAssignment(incident, technician, actor.getId(), now, "");
        return toResponse(incident, actor, now);
    }

    /** Admin asks the active strategy to pick (excludes the current assignee, so it can also re-assign). */
    public IncidentResponse autoAssign(Long id, UserPrincipal actor) {
        Incident incident = loadForAction(id, IncidentAction.ASSIGN, actor);
        incident.ensureAllowed(IncidentAction.ASSIGN); // a CLOSED incident fails here, before any ranking
        AssignmentProposal proposal = assignmentService.propose(incident);
        if (!proposal.hasCandidate()) {
            throw new NoEligibleTechnicianException(incident.getNumber(), proposal.noCandidateReason());
        }
        Instant now = clock.instant();
        applyAssignment(incident, proposal.technician(), actor.getId(), now, proposal.describe());
        return toResponse(incident, actor, now);
    }

    /** Ranked technicians with reasons (smart recommendation). Read-only: nothing is assigned. */
    public RecommendationResponse recommendations(Long id, String strategy, UserPrincipal actor) {
        Incident incident = loadForAction(id, IncidentAction.ASSIGN, actor);
        incident.ensureAllowed(IncidentAction.ASSIGN);
        return assignmentService.recommend(incident, strategy);
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

    /** Shared by manual and automatic assignment: check workload, assign, publish. actorId null = system. */
    private void applyAssignment(Incident incident, Technician technician, Long actorId, Instant now, String how) {
        workloadService.ensureCanAccept(technician);
        Long previousId = incident.getAssignedTechnician() == null ? null : incident.getAssignedTechnician().getId();
        IncidentStatus from = incident.getStatus();
        incident.assignTo(technician, now);

        publish(new IncidentAssignedEvent(incident.getId(), actorId, now, technician.getId(), previousId));
        publishStatusChange(incident, from, IncidentAction.ASSIGN, actorId, now,
                (previousId == null ? "Assigned to " : "Re-assigned to ") + technician.getFullName() + how);
    }

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
        List<Incident> duplicates = incidentRepository.findByDuplicateOfIdOrderByIdAsc(incident.getId());
        return IncidentResponse.from(incident, duplicates, accessPolicy.availableActions(incident, actor),
                canEdit, canAddNote, now);
    }

    private static String preview(String text) {
        String trimmed = text.trim();
        return trimmed.length() <= 80 ? trimmed : trimmed.substring(0, 77) + "...";
    }
}
