package com.itsm.intelligence;

import com.itsm.catalog.BusinessCriticality;
import com.itsm.catalog.Category;
import com.itsm.catalog.ITService;
import com.itsm.incident.Incident;
import com.itsm.incident.IncidentRepository;
import com.itsm.intelligence.dto.SimilarIncidentResponse;
import com.itsm.user.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneOffset;
import java.util.List;

import static com.itsm.support.TestFixtures.T0;
import static com.itsm.support.TestFixtures.category;
import static com.itsm.support.TestFixtures.classified;
import static com.itsm.support.TestFixtures.employee;
import static com.itsm.support.TestFixtures.incident;
import static com.itsm.support.TestFixtures.service;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DuplicateDetectorTest {

    private Category application;
    private ITService payment;
    private ITService email;
    private DuplicateDetector detector;

    @BeforeEach
    void setUp() {
        application = category(8, "APPLICATION");
        Category network = category(3, "NETWORK");
        payment = service(1, "Payment Gateway", BusinessCriticality.CRITICAL, application);
        email = service(4, "Corporate Email", BusinessCriticality.HIGH, application);
        Employee rahul = employee(6, "Rahul Verma");
        Incident paymentIncident = classified(incident(1, rahul, payment, "Payment page shows an error at checkout",
                "Customers get 'Transaction failed' at the last checkout step. Started around 9 AM."), application, T0);
        Incident emailIncident = classified(incident(4, rahul, email, "Email not syncing on my phone",
                "Corporate email stopped syncing on my phone yesterday evening."), application, T0);
        Incident vpnIncident = classified(incident(3, rahul, service(5, "VPN", BusinessCriticality.HIGH, network),
                "VPN disconnects every few minutes", "Remote sales team loses VPN connection."), network, T0);

        IncidentRepository repository = mock(IncidentRepository.class);
        when(repository.findSimilarityCandidates(any())).thenReturn(List.of(paymentIncident, emailIncident, vpnIncident));
        detector = new DuplicateDetector(repository, Clock.fixed(T0.plusSeconds(3600), ZoneOffset.UTC));
    }

    @Test
    @DisplayName("A new payment report matches the open payment incident with score 42")
    void findsTheSimilarIncident() {
        List<SimilarIncidentResponse> similar = detector.findSimilar("Payment transaction failing",
                "Checkout returns an error after entering card details.", payment, application, null);
        assertThat(similar).hasSize(1);
        SimilarIncidentResponse match = similar.get(0);
        assertThat(match.number()).isEqualTo("INC00001");
        assertThat(match.score()).isEqualTo(42);
        assertThat(match.sameService()).isTrue();
        assertThat(match.sameCategory()).isTrue();
        assertThat(match.sharedWords()).contains("payment", "transaction", "fail", "checkout", "error");
    }

    @Test
    @DisplayName("The brief's example: 'Unable to make payment' matches the payment incident")
    void briefExample() {
        assertThat(detector.findSimilar("Unable to make payment", null, payment, application, null))
                .extracting(SimilarIncidentResponse::number).containsExactly("INC00001");
    }

    @Test
    @DisplayName("An incident is never reported as a duplicate of itself")
    void excludesItself() {
        assertThat(detector.findSimilar("Payment page shows an error at checkout", "", payment, application, 1L))
                .extracting(SimilarIncidentResponse::number).doesNotContain("INC00001");
    }

    @Test
    @DisplayName("Being on the same service alone is not enough")
    void sameServiceAloneIsNotADuplicate() {
        assertThat(detector.findSimilar("Printer jammed on floor two", null, payment, application, null)).isEmpty();
    }

    @Test
    @DisplayName("Unrelated text finds nothing")
    void unrelatedFindsNothing() {
        assertThat(detector.findSimilar("Laptop battery drains quickly", "Battery lasts one hour.", null, null, null)).isEmpty();
    }
}
