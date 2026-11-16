package com.itsm.integration;

import com.itsm.support.IntegrationTest;
import com.itsm.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@IntegrationTest
class SecurityIntegrationTest extends IntegrationTestBase {

    @Test
    @DisplayName("Login with a wrong password is 401 AUTHENTICATION_FAILED")
    void wrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + RAHUL + "\", \"password\": \"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));
    }

    @Test
    @DisplayName("Calling the API without a token is 401")
    void noToken() throws Exception {
        mvc.perform(get("/api/incidents")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Employees can't use admin endpoints (403)")
    void employeeBlockedFromAdminEndpoints() throws Exception {
        call(RAHUL, get("/api/reports/overview")).andExpect(status().isForbidden());
        call(RAHUL, get("/api/audit")).andExpect(status().isForbidden());
        call(RAHUL, get("/api/assignment/settings")).andExpect(status().isForbidden());
        call(RAHUL, post("/api/sla/monitor/run")).andExpect(status().isForbidden());
        call(RAHUL, get("/api/users")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Technicians can't see reports or the audit log (403)")
    void technicianBlockedFromAdminEndpoints() throws Exception {
        call(FATIMA, get("/api/reports/overview")).andExpect(status().isForbidden());
        call(FATIMA, get("/api/audit")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("An employee can't open someone else's incident (INC00003 is Kiran's)")
    void employeeCantSeeOthersIncident() throws Exception {
        call(RAHUL, get("/api/incidents/3"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED_OPERATION"));
    }

    @Test
    @DisplayName("Search never widens visibility: Rahul searching 'vpn' only finds his own incidents")
    void searchRespectsVisibility() throws Exception {
        call(RAHUL, get("/api/incidents").param("q", "vpn").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.number == 'INC00003')]").isEmpty())
                .andExpect(jsonPath("$.content[?(@.number == 'INC00018')]").isNotEmpty());
    }
}
