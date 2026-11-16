package com.itsm.integration;

import com.itsm.support.IntegrationTest;
import com.itsm.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Duplicate detection and linking (Workflow 3, first half), search, category suggestion and reports. */
@IntegrationTest
class IntelligenceAndReportsIntegrationTest extends IntegrationTestBase {

    private static final String PAYMENT_TITLE = "Payment transaction failing";
    private static final String PAYMENT_TEXT = "Checkout returns an error after entering card details.";

    @Test
    @DisplayName("Duplicate check finds the open payment incident INC00001 with score 42")
    void duplicateCheck() throws Exception {
        String body = """
                {"title": "%s", "description": "%s", "serviceId": %d}
                """.formatted(PAYMENT_TITLE, PAYMENT_TEXT, serviceId("Payment Gateway"));
        call(KIRAN, post("/api/intelligence/duplicates/check").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.number == 'INC00001')].score", contains(42)));
    }

    @Test
    @DisplayName("Link a new report as a duplicate of INC00001, reject a chain, then unlink")
    void linkAndUnlink() throws Exception {
        long id = id(report(KIRAN, PAYMENT_TITLE, PAYMENT_TEXT, "Payment Gateway", "HIGH", "HIGH", 80));

        call(ADMIN, post("/api/incidents/{id}/duplicate-of", id).content("{\"primaryIncidentId\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicateOf.number").value("INC00001"));
        call(ADMIN, get("/api/incidents/1"))
                .andExpect(jsonPath("$.duplicates[?(@.id == " + id + ")]").isNotEmpty());
        call(ADMIN, post("/api/incidents/1/duplicate-of").content("{\"primaryIncidentId\": " + id + "}"))
                .andExpect(status().isUnprocessableEntity());
        call(KIRAN, get("/api/notifications").param("size", "100"))
                .andExpect(jsonPath("$.content[?(@.type == 'DUPLICATE_LINKED' && @.incidentId == " + id + ")]").isNotEmpty());

        call(ADMIN, delete("/api/incidents/{id}/duplicate-of", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicateOf").doesNotExist());
    }

    @Test
    @DisplayName("Employees can't link duplicates (403 UNAUTHORIZED_OPERATION)")
    void employeesCantLink() throws Exception {
        call(RAHUL, post("/api/incidents/1/duplicate-of").content("{\"primaryIncidentId\": 2}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED_OPERATION"));
    }

    @Test
    @DisplayName("Category suggestion: a login problem suggests AUTHENTICATION")
    void categorySuggestion() throws Exception {
        call(RAHUL, post("/api/intelligence/category-suggestion")
                        .content("{\"title\": \"Cannot log in, password rejected\", \"description\": \"SSO says access denied\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("AUTHENTICATION"))
                .andExpect(jsonPath("$[0].matchCount").value(4));
    }

    @Test
    @DisplayName("Search: by number, and by priority + status")
    void search() throws Exception {
        call(ADMIN, get("/api/incidents").param("q", "INC00008"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].number").value("INC00008"));
        call(ADMIN, get("/api/incidents").param("q", "inc8"))
                .andExpect(jsonPath("$.content[0].number").value("INC00008"));
        call(ADMIN, get("/api/incidents").param("slaStatus", "BREACHED")
                        .param("reportedTo", yesterdayInIndia().toString()).param("size", "100"))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @DisplayName("Reports on the two weeks of historical data: 24 incidents, 5 violations, 79.2% SLA compliance")
    void historicalReports() throws Exception {
        String to = yesterdayInIndia().toString();
        call(ADMIN, get("/api/reports/overview").param("to", to))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncidents").value(24))
                .andExpect(jsonPath("$.openIncidents").value(0))
                .andExpect(jsonPath("$.slaViolations").value(5))
                .andExpect(jsonPath("$.slaCompliancePercent").value(79.2))
                .andExpect(jsonPath("$.averageResponseMinutes").value(32.0))
                .andExpect(jsonPath("$.averageRating").value(4.1));
        call(ADMIN, get("/api/reports/technicians").param("to", to))
                .andExpect(jsonPath("$[?(@.fullName == 'Sneha Reddy')].resolvedIncidents", contains(8)))
                .andExpect(jsonPath("$[?(@.fullName == 'Arjun Mehta')].slaViolations", contains(2)));
        call(ADMIN, get("/api/reports/trends").param("days", "14"))
                .andExpect(jsonPath("$.length()").value(14));
    }

    @Test
    @DisplayName("Regression: historical seeding sends no notifications (Rahul has exactly his 11 demo notifications)")
    void historicalSeedingIsSilent() throws Exception {
        call(RAHUL, get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unread").value(11));
    }

    @Test
    @DisplayName("Regression: historical SLA violations are recorded at their original dates, not today")
    void historicalViolationsKeepTheirDates() throws Exception {
        call(ADMIN, get("/api/sla/violations").param("incidentNumber", "INC00013"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].target").value("RESPONSE"))
                .andExpect(jsonPath("$.content[0].detectedAt").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.startsWith(java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString()))));
    }

    @Test
    @DisplayName("Reports reject an inverted date range (400)")
    void invertedRange() throws Exception {
        call(ADMIN, get("/api/reports/overview").param("from", "2026-11-10").param("to", "2026-11-01"))
                .andExpect(status().isBadRequest());
    }
}
