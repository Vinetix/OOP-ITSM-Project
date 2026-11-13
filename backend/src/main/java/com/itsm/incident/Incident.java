package com.itsm.incident;

import com.itsm.catalog.Category;
import com.itsm.catalog.ITService;
import com.itsm.catalog.dto.EffectiveSla;
import com.itsm.common.domain.BaseEntity;
import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.priority.PriorityResult;
import com.itsm.incident.priority.Urgency;
import com.itsm.incident.sla.SlaTracking;
import com.itsm.incident.state.IncidentAction;
import com.itsm.incident.state.IncidentState;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Technician;
import com.itsm.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * The central domain object.
 *
 * - State pattern: every lifecycle method first asks the current state "is this allowed, and where
 *   does it lead?" (state().next(action)). Illegal moves throw InvalidStateTransitionException
 *   BEFORE any field changes, so the incident is never left half-updated.
 * - Encapsulation: no setters. The only way to change an incident is through these
 *   business methods, which keep all its rules together.
 * - Composition: SlaTracking (embedded) and IncidentNote (owned list) belong to the incident.
 * - Association: reporter, service, category and assigned technician are references to
 *   independent objects.
 */
@Getter
@Entity
@Table(name = "incidents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Incident extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ITService service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Impact impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Urgency urgency;

    @Column(nullable = false)
    private int affectedUsers;

    @Enumerated(EnumType.STRING)
    @Column(length = 5)
    private Priority priority;

    private int priorityScore;

    @Column(length = 300)
    private String priorityReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private Technician assignedTechnician;

    private Instant assignedAt;

    @Embedded
    private SlaTracking sla;

    @Column(length = 2000)
    private String resolutionSummary;

    @Column(length = 1000)
    private String rootCause;

    private Integer feedbackRating;

    @Column(length = 1000)
    private String feedbackComment;

    private Instant verifiedAt;

    private Instant closedAt;

    @Column(length = 1000)
    private String closureNote;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<IncidentNote> notes = new ArrayList<>();

    public Incident(User reporter, ITService service, String title, String description,
                    Impact impact, Urgency urgency, int affectedUsers) {
        this.reporter = reporter;
        this.service = service;
        this.title = title.trim();
        this.description = description.trim();
        this.impact = impact;
        this.urgency = urgency;
        this.affectedUsers = affectedUsers;
        this.status = IncidentStatus.NEW;
    }

    // ---------------- lifecycle (each one delegates the "is it allowed?" question to the State) ----------------

    public void classify(Category category, PriorityResult priorityResult, EffectiveSla effectiveSla, Instant now) {
        IncidentStatus next = state().next(IncidentAction.CLASSIFY);
        this.category = category;
        applyPriority(priorityResult);
        this.sla = SlaTracking.start(effectiveSla, now);
        this.status = next;
    }

    public void assignTo(Technician technician, Instant now) {
        IncidentStatus next = state().next(IncidentAction.ASSIGN);
        if (technician.equals(assignedTechnician)) {
            throw new BusinessRuleViolationException("This incident is already assigned to " + technician.getFullName());
        }
        this.assignedTechnician = technician;
        this.assignedAt = now;
        this.status = next;
    }

    public void acknowledge(Instant now) {
        IncidentStatus next = state().next(IncidentAction.ACKNOWLEDGE);
        sla.recordResponse(now);
        this.status = next;
    }

    public void start() {
        this.status = state().next(IncidentAction.START);
    }

    public void requestInfo(User technician, String question) {
        IncidentStatus next = state().next(IncidentAction.REQUEST_INFO);
        addNoteInternal(technician, NoteType.INFO_REQUEST, question);
        this.status = next;
    }

    public void provideInfo(User reporter, String answer) {
        IncidentStatus next = state().next(IncidentAction.PROVIDE_INFO);
        addNoteInternal(reporter, NoteType.INFO_RESPONSE, answer);
        this.status = next;
    }

    public void resolve(String resolutionSummary, String rootCause, Instant now) {
        IncidentStatus next = state().next(IncidentAction.RESOLVE);
        this.resolutionSummary = resolutionSummary.trim();
        this.rootCause = blankToNull(rootCause);
        sla.recordResolution(now);
        this.status = next;
    }

    public void verify(Integer rating, String feedback, Instant now) {
        IncidentStatus next = state().next(IncidentAction.VERIFY);
        this.feedbackRating = rating;
        this.feedbackComment = blankToNull(feedback);
        this.verifiedAt = now;
        this.status = next;
    }

    public void reopen(User reporter, String reason) {
        IncidentStatus next = state().next(IncidentAction.REOPEN);
        addNoteInternal(reporter, NoteType.REOPEN, reason);
        sla.reopen();
        this.status = next;
    }

    public void close(String closureNote, Instant now) {
        IncidentStatus next = state().next(IncidentAction.CLOSE);
        this.closureNote = blankToNull(closureNote);
        this.closedAt = now;
        this.status = next;
    }

    /** Throws InvalidStateTransitionException if the action isn't allowed now; changes nothing. */
    public void ensureAllowed(IncidentAction action) {
        state().next(action);
    }

    // ---------------- details, priority, notes ----------------

    /**
     * Changes only the values that are not null. Returns the names of the fields that changed.
     * Allowed only while the current state is editable (before RESOLVED).
     */
    public List<String> updateDetails(String title, String description, ITService service, Category category,
                                      Impact impact, Urgency urgency, Integer affectedUsers) {
        if (!state().isEditable()) {
            throw new IncidentNotEditableException("Incident details can't be changed in status " + status);
        }
        List<String> changed = new ArrayList<>();
        if (title != null && !title.trim().equals(this.title)) {
            this.title = title.trim();
            changed.add("title");
        }
        if (description != null && !description.trim().equals(this.description)) {
            this.description = description.trim();
            changed.add("description");
        }
        if (service != null && !service.equals(this.service)) {
            this.service = service;
            changed.add("service");
        }
        if (category != null && !category.equals(this.category)) {
            this.category = category;
            changed.add("category");
        }
        if (impact != null && impact != this.impact) {
            this.impact = impact;
            changed.add("impact");
        }
        if (urgency != null && urgency != this.urgency) {
            this.urgency = urgency;
            changed.add("urgency");
        }
        if (affectedUsers != null && !Objects.equals(affectedUsers, this.affectedUsers)) {
            this.affectedUsers = affectedUsers;
            changed.add("affectedUsers");
        }
        return changed;
    }

    /** New priority and SLA targets after details changed (deadlines still count from the original start). */
    public void reprioritize(PriorityResult priorityResult, EffectiveSla effectiveSla) {
        applyPriority(priorityResult);
        sla.retarget(effectiveSla);
    }

    public IncidentNote addNote(User author, NoteType type, String text) {
        if (!state().acceptsNotes()) {
            throw new IncidentNotEditableException("Notes can't be added to an incident in status " + status);
        }
        return addNoteInternal(author, type, text);
    }

    // ---------------- queries ----------------

    /** Human-friendly id like INC00042 (derived from the database id, not stored). */
    public String getNumber() {
        return getId() == null ? null : String.format("INC%05d", getId());
    }

    public List<IncidentNote> getNotes() {
        return Collections.unmodifiableList(notes);
    }

    public IncidentState state() {
        return status.state();
    }

    public boolean isReportedBy(Long userId) {
        return reporter != null && reporter.getId().equals(userId);
    }

    public boolean isAssignedTo(Long userId) {
        return assignedTechnician != null && assignedTechnician.getId().equals(userId);
    }

    // ---------------- helpers ----------------

    private void applyPriority(PriorityResult result) {
        this.priority = result.priority();
        this.priorityScore = result.score();
        String reason = result.explanation();
        this.priorityReason = reason.length() > 300 ? reason.substring(0, 300) : reason;
    }

    private IncidentNote addNoteInternal(User author, NoteType type, String text) {
        IncidentNote note = new IncidentNote(this, author, type, text.trim());
        notes.add(note);
        return note;
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
