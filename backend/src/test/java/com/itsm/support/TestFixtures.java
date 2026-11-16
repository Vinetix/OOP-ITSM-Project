package com.itsm.support;

import com.itsm.catalog.BusinessCriticality;
import com.itsm.catalog.Category;
import com.itsm.catalog.ITService;
import com.itsm.catalog.dto.EffectiveSla;
import com.itsm.common.domain.BaseEntity;
import com.itsm.incident.Incident;
import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Priority;
import com.itsm.incident.priority.PriorityResult;
import com.itsm.incident.priority.Urgency;
import com.itsm.user.Admin;
import com.itsm.user.Employee;
import com.itsm.user.Technician;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;

/**
 * Builds real domain objects for unit tests (no Spring, no database). Ids normally come from the
 * database, so tests set them explicitly with withId().
 */
public final class TestFixtures {

    public static final Instant T0 = Instant.parse("2026-11-16T04:00:00Z");

    private TestFixtures() {
    }

    public static <T extends BaseEntity> T withId(T entity, long id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    public static Category category(long id, String code, String... keywords) {
        return withId(new Category(code, code.charAt(0) + code.substring(1).toLowerCase(), code + " problems", List.of(keywords)), id);
    }

    public static ITService service(long id, String name, BusinessCriticality criticality, Category defaultCategory) {
        return withId(new ITService(name, name + " service", criticality, defaultCategory), id);
    }

    public static Employee employee(long id, String name) {
        return withId(new Employee(name, email(name), "hash", null, "Sales"), id);
    }

    public static Technician technician(long id, String name, boolean senior, int maxActive, int years) {
        return withId(new Technician(name, email(name), "hash", null, senior, maxActive, years), id);
    }

    public static Admin admin(long id, String name) {
        return withId(new Admin(name, email(name), "hash", null), id);
    }

    public static Incident incident(long id, Employee reporter, ITService service, String title, String description) {
        return withId(new Incident(reporter, service, title, description, Impact.HIGH, Urgency.HIGH, 80), id);
    }

    /** NEW → CLASSIFIED as P1 with a 5-minute response / 30-minute resolution SLA starting at {at}. */
    public static Incident classified(Incident incident, Category category, Instant at) {
        incident.classify(category, new PriorityResult(Priority.P1, 36, "test"), p1Sla(), at);
        return incident;
    }

    public static EffectiveSla p1Sla() {
        return new EffectiveSla(1L, "DEFAULT", Priority.P1, 5, 30);
    }

    private static String email(String name) {
        return name.toLowerCase().replace(' ', '.') + "@itsm.com";
    }
}
