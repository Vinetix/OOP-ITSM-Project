package com.itsm.seed;

import com.itsm.catalog.Category;
import com.itsm.catalog.CategoryRepository;
import com.itsm.catalog.ITService;
import com.itsm.catalog.ITServiceRepository;
import com.itsm.incident.IncidentRepository;
import com.itsm.incident.IncidentService;
import com.itsm.incident.assignment.AssignmentSettingsService;
import com.itsm.incident.dto.CreateIncidentRequest;
import com.itsm.incident.dto.ResolveIncidentRequest;
import com.itsm.incident.dto.VerifyIncidentRequest;
import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Urgency;
import com.itsm.security.ItsmUserDetailsService;
import com.itsm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Creates 8 realistic demo incidents in different lifecycle states, so every screen has data.
 *
 * Important design choice: incidents are NOT inserted directly into the database. Each one goes
 * through the real IncidentService (report -> assign -> acknowledge -> ...), exactly as if users
 * clicked the buttons. So priority, SLA deadlines, state rules and published events are all
 * genuine, and the seeder doubles as an end-to-end check of the lifecycle.
 *
 * Automatic assignment on report is switched off while seeding, because each demo incident is assigned
 * to a specific technician by the admin below (and #4 and #8 must stay CLASSIFIED for the assignment
 * demo). The admin's setting is restored afterwards, even if seeding fails.
 *
 * Runs after the user (@Order 1) and catalog (@Order 2) seeders, only when there are no incidents.
 */
@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class IncidentDemoDataSeeder implements CommandLineRunner {

    private final IncidentRepository incidentRepository;
    private final IncidentService incidentService;
    private final ItsmUserDetailsService users;
    private final ITServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;
    private final AssignmentSettingsService assignmentSettings;

    @Override
    public void run(String... args) {
        long existing = incidentRepository.count();
        if (existing > 0) {
            log.info("Demo data OK: {} incidents already in the database, nothing to seed", existing);
            return;
        }
        if (serviceRepository.count() == 0) {
            log.warn("Demo incidents: skipped, the service catalog is empty (catalog seeder didn't run?)");
            return;
        }
        boolean autoAssign = assignmentSettings.isAutoAssignOnReport();
        try {
            assignmentSettings.changeAutoAssignOnReport(false);
            seed();
            log.info("Seeded {} demo incidents across the lifecycle", incidentRepository.count());
        } catch (RuntimeException e) {
            // Demo data must never stop the application from starting.
            log.warn("Demo incident seeding stopped early after {} incidents: {}",
                    incidentRepository.count(), e.getMessage(), e);
        } finally {
            assignmentSettings.changeAutoAssignOnReport(autoAssign);
        }
    }

    private void seed() {
        UserPrincipal admin = user("admin@itsm.com");
        UserPrincipal ravi = user("ravi.kumar@itsm.com");
        UserPrincipal fatima = user("fatima.khan@itsm.com");
        UserPrincipal sneha = user("sneha.reddy@itsm.com");
        UserPrincipal arjun = user("arjun.mehta@itsm.com");
        UserPrincipal rahul = user("rahul.verma@itsm.com");
        UserPrincipal divya = user("divya.nair@itsm.com");
        UserPrincipal kiran = user("kiran.patel@itsm.com");

        // 1. IN_PROGRESS (P1): payment errors, being investigated by Fatima
        Long payment = report(rahul, "Payment page shows an error at checkout",
                "Customers get 'Transaction failed' at the last checkout step. Started around 9 AM.",
                "Payment Gateway", null, Impact.HIGH, Urgency.HIGH, 250);
        incidentService.assign(payment, fatima.getId(), admin);
        incidentService.acknowledge(payment, fatima);
        incidentService.start(payment, fatima);
        incidentService.addNote(payment, "Gateway logs show timeouts from the bank API. Contacting the provider.", fatima);

        // 2. AWAITING_INFO (P4): technician asked the reporter a question
        Long hrLogin = report(divya, "Cannot log in to the HR portal",
                "The HR portal keeps returning me to the login page after I enter my password.",
                "HR Portal", "AUTHENTICATION", Impact.LOW, Urgency.MEDIUM, 1);
        incidentService.assign(hrLogin, sneha.getId(), admin);
        incidentService.acknowledge(hrLogin, sneha);
        incidentService.start(hrLogin, sneha);
        incidentService.requestInfo(hrLogin, "Which browser are you using, and does it happen in a private window too?", sneha);

        // 3. ASSIGNED, not yet acknowledged (P2): response SLA is running
        Long vpn = report(kiran, "VPN disconnects every few minutes",
                "Remote sales team loses VPN connection every 5-10 minutes since this morning.",
                "VPN", null, Impact.MEDIUM, Urgency.HIGH, 20);
        incidentService.assign(vpn, ravi.getId(), admin);

        // 4. CLASSIFIED, waiting for assignment (P4)
        report(rahul, "Laptop battery not charging",
                "My laptop battery stays at 0% even when plugged in.",
                "Employee Laptops & Desktops", null, Impact.LOW, Urgency.LOW, 1);

        // 5. RESOLVED, waiting for the reporter to verify (P3)
        Long drive = report(divya, "Shared drive folder missing",
                "The 'Payroll 2026' folder disappeared from the HR shared drive.",
                "Cloud File Storage", null, Impact.MEDIUM, Urgency.MEDIUM, 15);
        incidentService.assign(drive, arjun.getId(), admin);
        incidentService.acknowledge(drive, arjun);
        incidentService.start(drive, arjun);
        incidentService.resolve(drive, new ResolveIncidentRequest(
                "Folder was moved by a sync rule; restored it from last night's backup.",
                "Misconfigured sync rule"), arjun);

        // 6. CLOSED with 5-star feedback (P3)
        Long email = report(kiran, "Email not syncing on my phone",
                "Corporate email stopped syncing on my phone yesterday evening.",
                "Corporate Email", null, Impact.LOW, Urgency.MEDIUM, 1);
        incidentService.assign(email, sneha.getId(), admin);
        incidentService.acknowledge(email, sneha);
        incidentService.start(email, sneha);
        incidentService.resolve(email, new ResolveIncidentRequest(
                "Re-registered the device in the mail profile and reset the sync token.", null), sneha);
        incidentService.verify(email, new VerifyIncidentRequest(5, "Fixed quickly, thank you!"), kiran);
        incidentService.close(email, "Confirmed by reporter.", sneha);

        // 7. CLOSED with 4-star feedback (P3), closed by the admin
        Long wifi = report(rahul, "Wi-Fi very slow on the 3rd floor",
                "Wi-Fi speed on the 3rd floor drops below 1 Mbps in the afternoons.",
                "Office Network & Wi-Fi", null, Impact.MEDIUM, Urgency.MEDIUM, 40);
        incidentService.assign(wifi, ravi.getId(), admin);
        incidentService.acknowledge(wifi, ravi);
        incidentService.start(wifi, ravi);
        incidentService.resolve(wifi, new ResolveIncidentRequest(
                "Replaced a faulty access point and rebalanced channels.", "Faulty access point"), ravi);
        incidentService.verify(wifi, new VerifyIncidentRequest(4, "Much better now."), rahul);
        incidentService.close(wifi, null, admin);

        // 8. CLASSIFIED, unassigned critical incident (P1): good for the assignment/escalation demo
        report(kiran, "Customer records queries timing out",
                "Customer lookups in the CRM time out after 30 seconds for all sales staff.",
                "Customer Database", null, Impact.HIGH, Urgency.HIGH, 80);
    }

    private Long report(UserPrincipal reporter, String title, String description, String serviceName,
                        String categoryCode, Impact impact, Urgency urgency, int affectedUsers) {
        ITService service = serviceRepository.findByNameIgnoreCase(serviceName)
                .orElseThrow(() -> new IllegalStateException("Missing demo service " + serviceName));
        Long categoryId = categoryCode == null ? null : categoryRepository.findByCodeIgnoreCase(categoryCode)
                .map(Category::getId)
                .orElseThrow(() -> new IllegalStateException("Missing demo category " + categoryCode));
        return incidentService.report(new CreateIncidentRequest(title, description, service.getId(), categoryId,
                impact, urgency, affectedUsers), reporter).id();
    }

    private UserPrincipal user(String email) {
        return users.loadUserByUsername(email);
    }
}
