package com.itsm.notification;

import com.itsm.catalog.BusinessCriticality;
import com.itsm.catalog.Category;
import com.itsm.incident.Incident;
import com.itsm.incident.IncidentRepository;
import com.itsm.incident.event.IncidentCreatedEvent;
import com.itsm.incident.event.IncidentEscalatedEvent;
import com.itsm.incident.event.IncidentPriorityChangedEvent;
import com.itsm.incident.event.IncidentSlaBreachedEvent;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.SlaTarget;
import com.itsm.user.Admin;
import com.itsm.user.Employee;
import com.itsm.user.Technician;
import com.itsm.user.User;
import com.itsm.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.itsm.support.TestFixtures.T0;
import static com.itsm.support.TestFixtures.admin;
import static com.itsm.support.TestFixtures.category;
import static com.itsm.support.TestFixtures.classified;
import static com.itsm.support.TestFixtures.employee;
import static com.itsm.support.TestFixtures.incident;
import static com.itsm.support.TestFixtures.service;
import static com.itsm.support.TestFixtures.technician;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Who hears about what. */
class IncidentNotificationRulesTest {

    private Employee rahul;
    private Technician fatima;
    private Technician ravi;
    private Technician sneha;
    private Admin anita;
    private Incident incident;
    private IncidentNotificationRules rules;

    @BeforeEach
    void setUp() {
        rahul = employee(6, "Rahul Verma");
        fatima = technician(3, "Fatima Khan", true, 6, 11);
        ravi = technician(2, "Ravi Kumar", true, 6, 9);
        sneha = technician(4, "Sneha Reddy", false, 5, 4);
        anita = admin(1, "Anita Rao");
        Category application = category(8, "APPLICATION");
        incident = classified(incident(9, rahul, service(1, "Payment Gateway", BusinessCriticality.CRITICAL, application),
                "Payment page down", "Checkout fails."), application, T0);
        incident.assignTo(fatima, T0);

        UserRepository users = mock(UserRepository.class);
        when(users.findAll()).thenReturn(List.<User>of(anita, fatima, ravi, sneha, rahul));
        rules = new IncidentNotificationRules(users, mock(IncidentRepository.class));
    }

    private List<String> recipients(List<NotificationMessage> messages) {
        return messages.stream().map(m -> m.recipient().getFullName()).toList();
    }

    @Test
    @DisplayName("Regression: the reporter gets a receipt for their own report")
    void receiptGoesToTheReporter() {
        List<NotificationMessage> messages = rules.messagesFor(
                new IncidentCreatedEvent(9L, rahul.getId(), T0, "INC00009", "Payment page down"), incident);
        assertThat(recipients(messages)).containsExactly("Rahul Verma");
        assertThat(messages.get(0).type()).isEqualTo(NotificationType.INCIDENT_REPORTED);
    }

    @Test
    @DisplayName("Nobody is notified about their own action")
    void actorIsNotNotified() {
        List<NotificationMessage> messages = rules.messagesFor(
                new IncidentPriorityChangedEvent(9L, fatima.getId(), T0, Priority.P3, Priority.P1, "edited"), incident);
        assertThat(recipients(messages)).containsExactly("Rahul Verma");
    }

    @Test
    @DisplayName("An SLA breach goes to the technician and the admins, never the reporter")
    void breachRecipients() {
        List<NotificationMessage> messages = rules.messagesFor(
                new IncidentSlaBreachedEvent(9L, null, T0, SlaTarget.RESPONSE, 5, T0), incident);
        assertThat(recipients(messages)).containsExactlyInAnyOrder("Fatima Khan", "Anita Rao");
        assertThat(messages).allMatch(NotificationMessage::important);
    }

    @Test
    @DisplayName("Escalation level 2 alerts available seniors other than the assignee")
    void levelTwoGoesToSeniors() {
        List<NotificationMessage> messages = rules.messagesFor(
                new IncidentEscalatedEvent(9L, null, T0, 1, 2, fatima.getId(), "Not acknowledged"), incident);
        assertThat(recipients(messages)).containsExactly("Ravi Kumar");
    }

    @Test
    @DisplayName("Escalation level 2 falls back to the admins when no senior is available")
    void levelTwoFallsBackToAdmins() {
        ravi.changeAvailability(false);
        List<NotificationMessage> messages = rules.messagesFor(
                new IncidentEscalatedEvent(9L, null, T0, 1, 2, fatima.getId(), "Not acknowledged"), incident);
        assertThat(recipients(messages)).containsExactly("Anita Rao");
    }

    @Test
    @DisplayName("Deactivated users get nothing")
    void deactivatedUsersGetNothing() {
        rahul.deactivate();
        assertThat(rules.messagesFor(new IncidentCreatedEvent(9L, rahul.getId(), T0, "INC00009", "x"), incident)).isEmpty();
    }
}
