package com.itsm.integration;

import com.itsm.support.IntegrationTest;
import com.itsm.support.IntegrationTestBase;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The brief's Workflows 1 and 2, end to end through the real API. */
@IntegrationTest
class IncidentWorkflowIntegrationTest extends IntegrationTestBase {

    @Test
    @DisplayName("Workflow 1: report → classified, prioritized (P1), SLA from the service policy, auto-assigned, reporter notified")
    void reportIsClassifiedPrioritizedAndAssigned() throws Exception {
        String incident = report(KIRAN, "Payment page down", "Checkout fails for every customer.",
                "Payment Gateway", "HIGH", "HIGH", 80);
        assertThat((String) JsonPath.read(incident, "$.priority")).isEqualTo("P1");
        assertThat((String) JsonPath.read(incident, "$.status")).isEqualTo("ASSIGNED");
        assertThat((Integer) JsonPath.read(incident, "$.sla.responseTargetMinutes")).isEqualTo(5);
        assertThat((Integer) JsonPath.read(incident, "$.sla.resolutionTargetMinutes")).isEqualTo(20);
        assertThat((String) JsonPath.read(incident, "$.assignedTechnician.fullName")).isNotBlank();

        String number = JsonPath.read(incident, "$.number");
        call(KIRAN, get("/api/notifications").param("size", "50"))
                .andExpect(jsonPath("$.content[?(@.title == '" + number + " received')]").isNotEmpty());
    }

    @Test
    @DisplayName("Workflow 2: acknowledge → start → resolve → verify → close, with the full audit history")
    void fullLifecycle() throws Exception {
        String incident = report(KIRAN, "Shared mailbox missing", "The support shared mailbox vanished from Outlook.",
                "Corporate Email", "MEDIUM", "MEDIUM", 4);
        long id = id(incident);
        String technician = TECHNICIAN_EMAILS.get(JsonPath.<String>read(incident, "$.assignedTechnician.fullName"));

        call(technician, post("/api/incidents/{id}/acknowledge", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"));
        call(technician, post("/api/incidents/{id}/start", id)).andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        call(technician, post("/api/incidents/{id}/resolve", id)
                .content("{\"resolutionSummary\": \"Re-granted mailbox permissions\", \"rootCause\": \"Permissions removed\"}"))
                .andExpect(jsonPath("$.status").value("RESOLVED"));
        call(KIRAN, post("/api/incidents/{id}/verify", id).content("{\"rating\": 5, \"feedback\": \"Thanks\"}"))
                .andExpect(jsonPath("$.status").value("VERIFIED"));
        call(technician, post("/api/incidents/{id}/close", id).content("{}"))
                .andExpect(jsonPath("$.status").value("CLOSED"));

        List<String> actions = JsonPath.read(json(call(ADMIN, get("/api/incidents/{id}/history", id))), "$[*].action");
        assertThat(actions).containsSubsequence("REPORTED", "CLASSIFY", "ASSIGN", "ACKNOWLEDGE", "START", "RESOLVE", "VERIFY", "CLOSE");

        call(KIRAN, get("/api/notifications").param("size", "100"))
                .andExpect(jsonPath("$.content[?(@.type == 'INCIDENT_RESOLVED' && @.incidentId == " + id + ")]").isNotEmpty());
    }

    @Test
    @DisplayName("Invalid transitions are rejected with 422 INVALID_STATE_TRANSITION")
    void invalidTransition() throws Exception {
        String incident = report(DIVYA, "Laptop fan very loud", "The fan runs at full speed all the time.",
                "Employee Laptops & Desktops", "LOW", "LOW", 1);
        long id = id(incident);
        String technician = TECHNICIAN_EMAILS.get(JsonPath.<String>read(incident, "$.assignedTechnician.fullName"));
        call(technician, post("/api/incidents/{id}/resolve", id).content("{\"resolutionSummary\": \"Fixed\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_STATE_TRANSITION"));
    }

    @Test
    @DisplayName("A reporter can't acknowledge their own incident (403)")
    void reporterCantAcknowledge() throws Exception {
        long id = id(report(DIVYA, "Wi-Fi drops near the lifts", "Connection drops when walking past the lifts.",
                "Office Network & Wi-Fi", "LOW", "MEDIUM", 3));
        call(DIVYA, post("/api/incidents/{id}/acknowledge", id)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Invalid input is 400 VALIDATION_FAILED with field errors")
    void invalidInput() throws Exception {
        call(RAHUL, post("/api/incidents").content("{\"title\": \"\", \"serviceId\": 1, \"impact\": \"HIGH\", \"urgency\": \"HIGH\", \"affectedUsers\": 1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.title").exists());
    }
}
