package com.itsm.incident;

import com.itsm.catalog.BusinessCriticality;
import com.itsm.catalog.Category;
import com.itsm.catalog.ITService;
import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.incident.state.InvalidStateTransitionException;
import com.itsm.user.Employee;
import com.itsm.user.Technician;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static com.itsm.support.TestFixtures.T0;
import static com.itsm.support.TestFixtures.category;
import static com.itsm.support.TestFixtures.classified;
import static com.itsm.support.TestFixtures.employee;
import static com.itsm.support.TestFixtures.incident;
import static com.itsm.support.TestFixtures.service;
import static com.itsm.support.TestFixtures.technician;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** State pattern: the incident lifecycle and its business rules, tested on the real domain object. */
class IncidentLifecycleTest {

    private Category application;
    private ITService payment;
    private Employee rahul;
    private Technician fatima;
    private Technician ravi;
    private Incident incident;

    @BeforeEach
    void setUp() {
        application = category(8, "APPLICATION", "payment");
        payment = service(1, "Payment Gateway", BusinessCriticality.CRITICAL, application);
        rahul = employee(6, "Rahul Verma");
        fatima = technician(3, "Fatima Khan", true, 6, 11);
        ravi = technician(2, "Ravi Kumar", true, 6, 9);
        incident = incident(100, rahul, payment, "Payment page down", "Checkout fails for everyone.");
    }

    private Incident inProgress() {
        classified(incident, application, T0);
        incident.assignTo(fatima, T0.plusSeconds(30));
        incident.acknowledge(T0.plusSeconds(60));
        incident.start();
        return incident;
    }

    @Test
    @DisplayName("A new incident starts in NEW")
    void newIncidentStartsAsNew() {
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.NEW);
    }

    @Test
    @DisplayName("NEW → CLOSED is blocked (the brief's example of an invalid transition)")
    void newIncidentCannotBeClosed() {
        assertThatThrownBy(() -> incident.close(null, T0)).isInstanceOf(InvalidStateTransitionException.class);
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.NEW);
    }

    @Test
    @DisplayName("The full lifecycle reaches CLOSED, after which nothing is allowed")
    void fullLifecycleReachesClosed() {
        classified(incident, application, T0);
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.CLASSIFIED);
        incident.assignTo(fatima, T0.plusSeconds(30));
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.ASSIGNED);
        incident.acknowledge(T0.plusSeconds(60));
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.ACKNOWLEDGED);
        incident.start();
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.IN_PROGRESS);
        incident.requestInfo(fatima, "Which browser do you use?");
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.AWAITING_INFO);
        incident.provideInfo(rahul, "Chrome");
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.IN_PROGRESS);
        incident.resolve("Restarted the payment service", "Memory leak", T0.plus(Duration.ofMinutes(10)));
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
        incident.verify(5, "Works now", T0.plus(Duration.ofMinutes(20)));
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.VERIFIED);
        incident.close("Done", T0.plus(Duration.ofMinutes(25)));
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.CLOSED);
        assertThat(incident.state().allowedActions()).isEmpty();
    }

    @Test
    @DisplayName("An incident can't be resolved before work has started")
    void cannotResolveBeforeWorkStarts() {
        classified(incident, application, T0);
        incident.assignTo(fatima, T0);
        assertThatThrownBy(() -> incident.resolve("Fixed", null, T0)).isInstanceOf(InvalidStateTransitionException.class);
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.ASSIGNED);
    }

    @Test
    @DisplayName("Reopening a resolved incident sends it back to IN_PROGRESS and restarts the resolution clock")
    void reopenGoesBackToInProgress() {
        inProgress().resolve("Fixed", null, T0.plus(Duration.ofMinutes(10)));
        incident.reopen(rahul, "Still failing");
        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.IN_PROGRESS);
        assertThat(incident.getSla().getResolvedAt()).isNull();
    }

    @Test
    @DisplayName("Re-assignment is allowed, but not to the technician who already has it")
    void reassignButNotToSameTechnician() {
        classified(incident, application, T0);
        incident.assignTo(fatima, T0);
        incident.assignTo(ravi, T0.plusSeconds(60));
        assertThat(incident.getAssignedTechnician()).isEqualTo(ravi);
        assertThatThrownBy(() -> incident.assignTo(ravi, T0.plusSeconds(90)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("already assigned");
    }

    @Test
    @DisplayName("Acknowledging records the response time; acknowledging late marks the response as breached")
    void acknowledgeRecordsResponse() {
        classified(incident, application, T0);
        incident.assignTo(fatima, T0);
        incident.acknowledge(T0.plus(Duration.ofMinutes(6)));
        assertThat(incident.getSla().getRespondedAt()).isEqualTo(T0.plus(Duration.ofMinutes(6)));
        assertThat(incident.getSla().isResponseBreached()).isTrue();
    }

    @Test
    @DisplayName("Only an ASSIGNED, unacknowledged incident is awaiting acknowledgement")
    void awaitingAcknowledgement() {
        classified(incident, application, T0);
        assertThat(incident.isAwaitingAcknowledgement()).isFalse();
        incident.assignTo(fatima, T0);
        assertThat(incident.isAwaitingAcknowledgement()).isTrue();
        incident.acknowledge(T0.plusSeconds(60));
        assertThat(incident.isAwaitingAcknowledgement()).isFalse();
    }

    @Test
    @DisplayName("The escalation level only goes up")
    void escalationNeverLowers() {
        assertThat(incident.escalateTo(2, T0)).isTrue();
        assertThat(incident.escalateTo(1, T0.plusSeconds(60))).isFalse();
        assertThat(incident.getEscalationLevel()).isEqualTo(2);
        assertThat(incident.getEscalatedAt()).isEqualTo(T0);
    }

    // ---------------- duplicate links ----------------

    @Test
    @DisplayName("An incident can be linked to a primary and unlinked again")
    void linkAndUnlink() {
        Incident primary = classified(incident(1, rahul, payment, "Payment page shows an error", "x"), application, T0);
        classified(incident, application, T0);
        incident.markAsDuplicateOf(primary, false);
        assertThat(incident.getDuplicateOf()).isSameAs(primary);
        assertThat(incident.unlinkDuplicate()).isSameAs(primary);
        assertThat(incident.getDuplicateOf()).isNull();
        assertThatThrownBy(incident::unlinkDuplicate).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    @DisplayName("An incident can't be a duplicate of itself")
    void notDuplicateOfItself() {
        assertThatThrownBy(() -> incident.markAsDuplicateOf(incident, false))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("itself");
    }

    @Test
    @DisplayName("Links are one level deep: the primary can't itself be a duplicate")
    void primaryCantBeADuplicate() {
        Incident root = incident(1, rahul, payment, "A", "a");
        Incident middle = incident(2, rahul, payment, "B", "b");
        middle.markAsDuplicateOf(root, false);
        assertThatThrownBy(() -> incident.markAsDuplicateOf(middle, false))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("link to INC00001 instead");
    }

    @Test
    @DisplayName("An incident that has duplicates of its own can't become a duplicate")
    void incidentWithDuplicatesCantBecomeOne() {
        Incident other = incident(2, rahul, payment, "B", "b");
        assertThatThrownBy(() -> incident.markAsDuplicateOf(other, true))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("duplicates of its own");
    }

    @Test
    @DisplayName("A CLOSED incident can't be linked")
    void closedIncidentCantBeLinked() {
        inProgress().resolve("Fixed", null, T0.plusSeconds(600));
        incident.verify(4, null, T0.plusSeconds(700));
        incident.close(null, T0.plusSeconds(800));
        Incident other = incident(2, rahul, payment, "B", "b");
        assertThatThrownBy(() -> incident.markAsDuplicateOf(other, false))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("closed");
    }
}
