package com.itsm.seed;

import com.itsm.catalog.ITService;
import com.itsm.catalog.ITServiceRepository;
import com.itsm.incident.IncidentService;
import com.itsm.incident.dto.CreateIncidentRequest;
import com.itsm.incident.dto.IncidentResponse;
import com.itsm.incident.dto.ResolveIncidentRequest;
import com.itsm.incident.dto.VerifyIncidentRequest;
import com.itsm.incident.priority.Impact;
import com.itsm.incident.priority.Urgency;
import com.itsm.incident.sla.AdjustableClock;
import com.itsm.incident.sla.SlaCheckService;
import com.itsm.notification.NotificationService;
import com.itsm.security.ItsmUserDetailsService;
import com.itsm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Two weeks of closed incidents, so dashboards, trends, averages and SLA compliance have real data.
 *
 * Each incident goes through the real services (report, assign, acknowledge, start, resolve, verify,
 * close) with the application clock pinned to a moment in the past for this thread only
 * (AdjustableClock.runAt). The audit history therefore shows the original times, and the SLA
 * violations of late incidents are recorded when they happened. Notifications are switched off while
 * this runs, so the demo users' inboxes only contain today's events.
 *
 * Deliberately no incidents on Payment Gateway or Customer Database: technicians' history on those
 * services would change the SMART assignment scores used in the test cases. All incidents end CLOSED,
 * so workloads and duplicate detection (which ignores closed incidents) are unaffected.
 *
 * Called by IncidentDemoDataSeeder after the 8 demo incidents, so those keep numbers INC00001–INC00008.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HistoricalDemoDataSeeder {

    static final ZoneId OFFICE_ZONE = ZoneId.of("Asia/Kolkata");

    private final IncidentService incidentService;
    private final ItsmUserDetailsService users;
    private final ITServiceRepository serviceRepository;
    private final AdjustableClock clock;
    private final SlaCheckService slaCheckService;
    private final NotificationService notificationService;

    /**
     * One scripted incident. ackFraction / resolveFraction are shares of the SLA target used before
     * acknowledging / resolving (above 1.0 = the SLA was breached).
     */
    record Script(int daysAgo, String time, String reporter, String title, String description, String service,
                  Impact impact, Urgency urgency, int affectedUsers, String technician,
                  double ackFraction, double resolveFraction, int rating, String comment,
                  String resolution, String rootCause) {
    }

    static final String RAHUL = "rahul.verma@itsm.com";
    static final String DIVYA = "divya.nair@itsm.com";
    static final String KIRAN = "kiran.patel@itsm.com";
    static final String RAVI = "ravi.kumar@itsm.com";
    static final String FATIMA = "fatima.khan@itsm.com";
    static final String SNEHA = "sneha.reddy@itsm.com";
    static final String ARJUN = "arjun.mehta@itsm.com";

    static final String EMAIL = "Corporate Email";
    static final String VPN = "VPN";
    static final String WIFI = "Office Network & Wi-Fi";
    static final String STORAGE = "Cloud File Storage";
    static final String HR = "HR Portal";
    static final String LAPTOPS = "Employee Laptops & Desktops";
    static final String SSO = "Single Sign-On (SSO)";

    static final List<Script> SCRIPTS = List.of(
            new Script(13, "09:40", RAHUL, "Outlook keeps asking for my password",
                    "Since this morning Outlook prompts for my password every few minutes.", EMAIL,
                    Impact.MEDIUM, Urgency.MEDIUM, 3, SNEHA, 0.3, 0.4, 5, "Sorted quickly.",
                    "Cleared cached credentials and re-created the mail profile.", "Stale cached credentials"),
            new Script(13, "11:15", KIRAN, "VPN disconnects every 10 minutes",
                    "The remote sales team loses the VPN connection roughly every 10 minutes.", VPN,
                    Impact.HIGH, Urgency.MEDIUM, 25, RAVI, 0.5, 0.8, 4, "Stable now.",
                    "Raised the idle timeout on the VPN concentrator.", "Idle timeout set too low"),
            new Script(12, "10:05", DIVYA, "Laptop battery drains in an hour",
                    "My laptop battery goes from full to empty in about an hour.", LAPTOPS,
                    Impact.LOW, Urgency.MEDIUM, 1, ARJUN, 0.2, 0.3, 5, "New battery works great.",
                    "Replaced the worn-out battery.", "Battery at end of life"),
            new Script(12, "14:30", RAHUL, "Shared finance folder missing files",
                    "Several spreadsheets disappeared from the shared finance folder overnight.", STORAGE,
                    Impact.MEDIUM, Urgency.MEDIUM, 8, ARJUN, 0.6, 1.3, 3, "Took a while, but files are back.",
                    "Restored the files from the nightly backup and fixed the sync rule.", "Faulty sync rule"),
            new Script(11, "09:10", KIRAN, "Cannot log in to SSO portal",
                    "All staff in the Pune office see 'access denied' on the SSO login page.", SSO,
                    Impact.HIGH, Urgency.HIGH, 300, SNEHA, 1.4, 0.9, 3, "Slow first response.",
                    "Renewed the expired SAML signing certificate.", "Expired SAML certificate"),
            new Script(11, "16:20", DIVYA, "HR portal leave form not saving",
                    "The leave request form shows a spinner and never saves.", HR,
                    Impact.LOW, Urgency.MEDIUM, 5, SNEHA, 0.1, 0.2, 4, "Thanks.",
                    "Cleared a stuck background job in the HR portal.", "Stuck background job"),
            new Script(10, "10:45", RAHUL, "Wi-Fi drops in meeting room B",
                    "Laptops lose Wi-Fi in meeting room B during video calls.", WIFI,
                    Impact.MEDIUM, Urgency.MEDIUM, 12, RAVI, 0.4, 0.5, 4, "Calls are fine now.",
                    "Moved the access point channel away from interference.", "Channel interference"),
            new Script(10, "12:00", KIRAN, "Email attachments fail to upload",
                    "Attachments above 2 MB fail to upload in the web mail client.", EMAIL,
                    Impact.MEDIUM, Urgency.HIGH, 20, FATIMA, 0.4, 0.6, 5, "Perfect.",
                    "Raised the upload size limit on the mail gateway.", "Upload limit too low"),
            new Script(9, "09:30", DIVYA, "Printer on 2nd floor not printing",
                    "Print jobs to the 2nd floor printer stay in the queue.", LAPTOPS,
                    Impact.LOW, Urgency.LOW, 10, ARJUN, 0.3, 0.5, 4, "Printing again.",
                    "Cleared the print queue and updated the printer driver.", "Corrupted print queue"),
            new Script(9, "15:10", RAHUL, "VPN very slow from home",
                    "The VPN is very slow from home; file transfers take ages.", VPN,
                    Impact.MEDIUM, Urgency.MEDIUM, 6, RAVI, 1.2, 0.7, 3, "OK now, but slow to start.",
                    "Moved the user group to a less loaded VPN gateway.", "Overloaded gateway"),
            new Script(8, "10:20", KIRAN, "Calendar invites not arriving",
                    "Meeting invites from external partners don't show up in my calendar.", EMAIL,
                    Impact.LOW, Urgency.MEDIUM, 4, SNEHA, 0.3, 0.4, 5, "Great.",
                    "Whitelisted the partner domain in the spam filter.", "Spam filter rule"),
            new Script(8, "13:45", DIVYA, "Payroll slip page shows blank",
                    "The payroll slip page in the HR portal is blank for October.", HR,
                    Impact.MEDIUM, Urgency.MEDIUM, 40, SNEHA, 0.2, 0.4, 4, "Thanks for the quick fix.",
                    "Re-ran the payroll slip generation job.", "Failed generation job"),
            new Script(7, "09:50", RAHUL, "Disk quota full on shared drive",
                    "We can't save anything to the team shared drive: quota exceeded.", STORAGE,
                    Impact.MEDIUM, Urgency.HIGH, 15, ARJUN, 0.5, 0.6, 4, "Good.",
                    "Increased the quota and archived old project folders.", "Quota too small"),
            new Script(7, "11:30", KIRAN, "Password reset email never arrives",
                    "The SSO password reset email never reaches my inbox.", SSO,
                    Impact.MEDIUM, Urgency.MEDIUM, 2, SNEHA, 0.6, 1.2, 2, "Took too long.",
                    "Fixed the SMTP relay settings of the SSO service.", "SMTP relay misconfigured"),
            new Script(6, "10:10", DIVYA, "Laptop screen flickering",
                    "My laptop screen flickers constantly after the last update.", LAPTOPS,
                    Impact.LOW, Urgency.MEDIUM, 1, ARJUN, 0.4, 0.6, 5, "Fixed!",
                    "Rolled back the display driver.", "Faulty display driver"),
            new Script(6, "14:40", RAHUL, "Office internet down on 4th floor",
                    "Nobody on the 4th floor has internet access.", WIFI,
                    Impact.HIGH, Urgency.HIGH, 60, RAVI, 0.3, 0.5, 5, "Very fast, thanks.",
                    "Replaced a failed switch on the 4th floor.", "Failed network switch"),
            new Script(5, "09:25", KIRAN, "Email search returns no results",
                    "Searching my mailbox returns nothing, even for recent mails.", EMAIL,
                    Impact.LOW, Urgency.LOW, 1, FATIMA, 0.2, 0.3, 4, "Works.",
                    "Rebuilt the mailbox search index.", "Corrupted search index"),
            new Script(5, "15:55", DIVYA, "Cannot upload documents to HR portal",
                    "Uploading certificates to the HR portal fails with an error.", HR,
                    Impact.MEDIUM, Urgency.HIGH, 30, SNEHA, 0.5, 0.7, 4, "Thanks.",
                    "Fixed the file type check for PDF uploads.", "Wrong file type validation"),
            new Script(4, "10:35", RAHUL, "VPN certificate expired warning",
                    "The VPN client warns that the server certificate has expired.", VPN,
                    Impact.MEDIUM, Urgency.HIGH, 50, RAVI, 0.4, 0.9, 4, "Good.",
                    "Installed the renewed VPN server certificate.", "Expired server certificate"),
            new Script(4, "12:50", KIRAN, "Keyboard not working after update",
                    "My laptop keyboard stopped working after the overnight update.", LAPTOPS,
                    Impact.LOW, Urgency.MEDIUM, 1, ARJUN, 0.3, 0.4, 5, "Back to normal.",
                    "Reinstalled the keyboard driver.", "Driver removed by update"),
            new Script(3, "09:15", DIVYA, "Backup restore request failing",
                    "Restoring last week's version of a document from backup fails.", STORAGE,
                    Impact.MEDIUM, Urgency.MEDIUM, 3, ARJUN, 0.7, 1.1, 3, "Took longer than expected.",
                    "Repaired the backup catalogue and restored the file.", "Damaged backup catalogue"),
            new Script(3, "11:40", RAHUL, "MFA codes rejected at login",
                    "My MFA codes are rejected every time I try to log in.", SSO,
                    Impact.MEDIUM, Urgency.HIGH, 20, SNEHA, 0.5, 0.8, 4, "Thanks.",
                    "Re-synchronised the MFA server time.", "MFA server clock drift"),
            new Script(2, "10:00", KIRAN, "Shared mailbox not visible",
                    "The sales shared mailbox disappeared from my Outlook.", EMAIL,
                    Impact.LOW, Urgency.MEDIUM, 6, FATIMA, 0.3, 0.5, 5, "Great, thanks.",
                    "Re-granted mailbox permissions for the sales group.", "Permissions removed"),
            new Script(1, "10:30", DIVYA, "Wi-Fi password not accepted on new phone",
                    "My new phone doesn't accept the office Wi-Fi password.", WIFI,
                    Impact.LOW, Urgency.MEDIUM, 1, RAVI, 0.1, 0.1, 5, "Quick, thanks!",
                    "Registered the new device for the office Wi-Fi.", "Device not registered"));

    public void seed() {
        UserPrincipal admin = users.loadUserByUsername("admin@itsm.com");
        Instant realNow = clock.realInstant();
        LocalDate today = LocalDate.ofInstant(realNow, OFFICE_ZONE);
        notificationService.withoutNotifications(() -> {
            for (Script script : SCRIPTS) {
                createClosedIncident(script, admin, today, realNow);
            }
        });
        log.info("Seeded {} historical (closed) incidents over the last two weeks", SCRIPTS.size());
    }

    private void createClosedIncident(Script s, UserPrincipal admin, LocalDate today, Instant realNow) {
        UserPrincipal reporter = users.loadUserByUsername(s.reporter());
        UserPrincipal technician = users.loadUserByUsername(s.technician());
        ITService service = serviceRepository.findByNameIgnoreCase(s.service())
                .orElseThrow(() -> new IllegalStateException("Missing demo service " + s.service()));

        Instant reportedAt = today.minusDays(s.daysAgo()).atTime(LocalTime.parse(s.time())).atZone(OFFICE_ZONE).toInstant();
        IncidentResponse created = clock.callAt(reportedAt, () -> incidentService.report(new CreateIncidentRequest(
                s.title(), s.description(), service.getId(), null, s.impact(), s.urgency(), s.affectedUsers()), reporter));
        Long id = created.id();
        int responseMinutes = created.sla().responseTargetMinutes();
        int resolutionMinutes = created.sla().resolutionTargetMinutes();

        Steps steps = new Steps(realNow);
        Instant assignAt = steps.next(reportedAt.plus(Duration.ofMinutes(1)));
        Instant ackAt = steps.next(reportedAt.plus(minutes(responseMinutes * s.ackFraction())));
        Instant startAt = steps.next(ackAt.plus(Duration.ofMinutes(2)));
        Instant resolveAt = steps.next(reportedAt.plus(minutes(resolutionMinutes * s.resolveFraction())));
        Instant verifyAt = steps.next(resolveAt.plus(Duration.ofMinutes(90)));
        Instant closeAt = steps.next(verifyAt.plus(Duration.ofMinutes(10)));

        clock.runAt(assignAt, () -> incidentService.assign(id, technician.getId(), admin));
        clock.runAt(ackAt, () -> {
            incidentService.acknowledge(id, technician);
            slaCheckService.check(id, ackAt); // records a late response at the moment it happened
        });
        clock.runAt(startAt, () -> incidentService.start(id, technician));
        clock.runAt(resolveAt, () -> {
            incidentService.resolve(id, new ResolveIncidentRequest(s.resolution(), s.rootCause()), technician);
            slaCheckService.check(id, resolveAt); // records a late resolution
        });
        clock.runAt(verifyAt, () -> incidentService.verify(id, new VerifyIncidentRequest(s.rating(), s.comment()), reporter));
        clock.runAt(closeAt, () -> incidentService.close(id, null, admin));
    }

    private static Duration minutes(double value) {
        return Duration.ofSeconds(Math.max(60, Math.round(value * 60)));
    }

    /** Keeps the steps in order (at least a minute apart) and safely in the past. */
    private static final class Steps {

        private final Instant latest;
        private Instant previous = Instant.EPOCH;

        Steps(Instant realNow) {
            this.latest = realNow.minus(Duration.ofMinutes(15));
        }

        Instant next(Instant wanted) {
            Instant at = wanted.isAfter(latest) ? latest : wanted;
            if (!at.isAfter(previous)) {
                at = previous.plus(Duration.ofMinutes(1));
            }
            previous = at;
            return at;
        }
    }
}
