package com.itsm.support;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Helpers for calling the real API as the demo users. */
public abstract class IntegrationTestBase {

    protected static final String ADMIN = "admin@itsm.com";
    protected static final String RAHUL = "rahul.verma@itsm.com";
    protected static final String DIVYA = "divya.nair@itsm.com";
    protected static final String KIRAN = "kiran.patel@itsm.com";
    protected static final String RAVI = "ravi.kumar@itsm.com";
    protected static final String FATIMA = "fatima.khan@itsm.com";
    protected static final String SNEHA = "sneha.reddy@itsm.com";
    protected static final String ARJUN = "arjun.mehta@itsm.com";
    protected static final String PASSWORD = "Password@123";

    /** Technician display name → login email (to act as whoever was auto-assigned). */
    protected static final Map<String, String> TECHNICIAN_EMAILS = Map.of(
            "Ravi Kumar", RAVI, "Fatima Khan", FATIMA, "Sneha Reddy", SNEHA, "Arjun Mehta", ARJUN);

    private static final Map<String, String> TOKENS = new ConcurrentHashMap<>();

    @Autowired
    private WebApplicationContext context;

    protected MockMvc mvc;

    @DynamicPropertySource
    static void testDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", TestDatabase::url);
        registry.add("spring.datasource.username", TestDatabase::username);
        registry.add("spring.datasource.password", TestDatabase::password);
    }

    @BeforeEach
    void setUpMockMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    protected String token(String email) throws Exception {
        String cached = TOKENS.get(email);
        if (cached != null) {
            return cached;
        }
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + email + "\", \"password\": \"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.accessToken");
        TOKENS.put(email, token);
        return token;
    }

    /** Adds the user's Bearer token and a JSON content type to a request. */
    protected MockHttpServletRequestBuilder as(String email, MockHttpServletRequestBuilder request) throws Exception {
        return request.header("Authorization", "Bearer " + token(email)).contentType(MediaType.APPLICATION_JSON);
    }

    protected ResultActions call(String email, MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(as(email, request));
    }

    protected static String json(ResultActions result) throws Exception {
        return result.andReturn().getResponse().getContentAsString();
    }

    protected long serviceId(String name) throws Exception {
        List<Integer> ids = JsonPath.read(json(call(ADMIN, get("/api/services"))), "$[?(@.name == '" + name + "')].id");
        return ids.get(0);
    }

    /** Reports an incident and returns its JSON (201 expected). */
    protected String report(String email, String title, String description, String service,
                            String impact, String urgency, int affectedUsers) throws Exception {
        String body = """
                {"title": "%s", "description": "%s", "serviceId": %d,
                 "impact": "%s", "urgency": "%s", "affectedUsers": %d}
                """.formatted(title, description, serviceId(service), impact, urgency, affectedUsers);
        return json(call(email, post("/api/incidents").content(body)).andExpect(status().isCreated()));
    }

    protected static long id(String incidentJson) {
        return ((Number) JsonPath.read(incidentJson, "$.id")).longValue();
    }

    protected static LocalDate yesterdayInIndia() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata")).minusDays(1);
    }
}
