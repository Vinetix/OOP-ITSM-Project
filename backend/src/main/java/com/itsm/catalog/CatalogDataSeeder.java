package com.itsm.catalog;

import com.itsm.incident.priority.Priority;
import com.itsm.user.Technician;
import com.itsm.user.TechnicianRepository;
import com.itsm.user.User;
import com.itsm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds the catalog on first start (only when there are no categories yet):
 * 9 categories with keywords, 9 IT services, 11 skills, default SLA policies (from the brief's table),
 * Payment Gateway overrides, and skills for the demo technicians.
 * Runs after UserDataSeeder (@Order(1)) because it needs the technicians.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class CatalogDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ITServiceRepository serviceRepository;
    private final SkillRepository skillRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return;
        }

        Map<String, Category> categories = seedCategories();
        Map<String, ITService> services = seedServices(categories);
        Map<String, Skill> skills = seedSkills(categories);
        seedSlaPolicies(services);
        assignTechnicianSkills(skills);

        log.info("Seeded catalog: {} categories, {} services, {} skills, {} SLA policies",
                categories.size(), services.size(), skills.size(), slaPolicyRepository.count());
    }

    private Map<String, Category> seedCategories() {
        Map<String, Category> map = new HashMap<>();
        category(map, "HARDWARE", "Hardware", "Laptops, desktops, printers and peripherals",
                "laptop", "desktop", "printer", "monitor", "keyboard", "mouse", "hardware", "screen", "battery");
        category(map, "SOFTWARE", "Software", "Installed applications and operating systems",
                "install", "software", "windows", "update", "license", "office", "excel", "crash");
        category(map, "NETWORK", "Network", "LAN, Wi-Fi, VPN and internet connectivity",
                "network", "wifi", "wi-fi", "vpn", "internet", "connectivity", "router", "latency", "dns", "slow");
        category(map, "DATABASE", "Database", "Database servers, queries and data access",
                "database", "db", "query", "sql", "postgres", "deadlock", "replication", "records");
        category(map, "CLOUD", "Cloud", "Cloud infrastructure, servers and deployments",
                "cloud", "aws", "azure", "server", "instance", "deployment", "kubernetes", "outage");
        category(map, "SECURITY", "Security", "Malware, phishing and suspicious activity",
                "security", "virus", "malware", "phishing", "breach", "suspicious", "hacked", "ransomware");
        category(map, "AUTHENTICATION", "Authentication", "Login, passwords, SSO and access",
                "login", "log in", "password", "sso", "otp", "locked", "authentication", "sign in", "mfa", "access denied");
        category(map, "APPLICATION", "Application", "Business applications and portals",
                "application", "app", "payment", "transaction", "portal", "checkout", "email", "error", "unavailable");
        category(map, "STORAGE", "Storage", "File storage, disks, quotas and backups",
                "storage", "disk", "drive", "file", "upload", "quota", "backup", "folder");
        return map;
    }

    private Map<String, ITService> seedServices(Map<String, Category> c) {
        Map<String, ITService> map = new HashMap<>();
        service(map, "Payment Gateway", "Online payment processing for customers",
                BusinessCriticality.CRITICAL, c.get("APPLICATION"));
        service(map, "Customer Database", "Primary PostgreSQL cluster holding customer records",
                BusinessCriticality.CRITICAL, c.get("DATABASE"));
        service(map, "Single Sign-On (SSO)", "Company-wide login for all internal applications",
                BusinessCriticality.CRITICAL, c.get("AUTHENTICATION"));
        service(map, "Corporate Email", "Email and calendars for all employees",
                BusinessCriticality.HIGH, c.get("APPLICATION"));
        service(map, "VPN", "Secure remote access to the internal network",
                BusinessCriticality.HIGH, c.get("NETWORK"));
        service(map, "Office Network & Wi-Fi", "Wired and wireless network in all offices",
                BusinessCriticality.MEDIUM, c.get("NETWORK"));
        service(map, "Cloud File Storage", "Shared drives and document storage",
                BusinessCriticality.MEDIUM, c.get("STORAGE"));
        service(map, "HR Portal", "Leave, payroll slips and HR requests",
                BusinessCriticality.LOW, c.get("APPLICATION"));
        service(map, "Employee Laptops & Desktops", "End-user computing devices",
                BusinessCriticality.LOW, c.get("HARDWARE"));
        return map;
    }

    private Map<String, Skill> seedSkills(Map<String, Category> c) {
        Map<String, Skill> map = new HashMap<>();
        skill(map, "Desktop & Laptop Support", c.get("HARDWARE"));
        skill(map, "OS & Software Installation", c.get("SOFTWARE"));
        skill(map, "Routing, Switching & Wi-Fi", c.get("NETWORK"));
        skill(map, "VPN & Firewalls", c.get("NETWORK"));
        skill(map, "PostgreSQL Administration", c.get("DATABASE"));
        skill(map, "AWS Cloud Operations", c.get("CLOUD"));
        skill(map, "Security Incident Response", c.get("SECURITY"));
        skill(map, "SSO & Active Directory", c.get("AUTHENTICATION"));
        skill(map, "Payment Systems", c.get("APPLICATION"));
        skill(map, "Web Application Support", c.get("APPLICATION"));
        skill(map, "Cloud Storage & Backup", c.get("STORAGE"));
        return map;
    }

    /** Defaults are the brief's SLA table; Payment Gateway gets stricter overrides. */
    private void seedSlaPolicies(Map<String, ITService> services) {
        slaPolicyRepository.saveAll(List.of(
                new SlaPolicy(null, Priority.P1, 5, 30),
                new SlaPolicy(null, Priority.P2, 15, 120),
                new SlaPolicy(null, Priority.P3, 60, 480),
                new SlaPolicy(null, Priority.P4, 240, 1440),
                new SlaPolicy(services.get("Payment Gateway"), Priority.P1, 5, 20),
                new SlaPolicy(services.get("Payment Gateway"), Priority.P2, 10, 60)
        ));
    }

    private void assignTechnicianSkills(Map<String, Skill> s) {
        giveSkills("ravi.kumar@itsm.com", s, "Routing, Switching & Wi-Fi", "VPN & Firewalls", "AWS Cloud Operations");
        giveSkills("fatima.khan@itsm.com", s, "Payment Systems", "Web Application Support", "PostgreSQL Administration");
        giveSkills("sneha.reddy@itsm.com", s, "SSO & Active Directory", "Security Incident Response", "Web Application Support");
        giveSkills("arjun.mehta@itsm.com", s, "Desktop & Laptop Support", "OS & Software Installation", "Cloud Storage & Backup");
    }

    // ---------------- helpers ----------------

    private void category(Map<String, Category> map, String code, String name, String description, String... keywords) {
        map.put(code, categoryRepository.save(new Category(code, name, description, Arrays.asList(keywords))));
    }

    private void service(Map<String, ITService> map, String name, String description,
                         BusinessCriticality criticality, Category defaultCategory) {
        map.put(name, serviceRepository.save(new ITService(name, description, criticality, defaultCategory)));
    }

    private void skill(Map<String, Skill> map, String name, Category category) {
        map.put(name, skillRepository.save(new Skill(name, null, category)));
    }

    private void giveSkills(String email, Map<String, Skill> skills, String... skillNames) {
        userRepository.findByEmailIgnoreCase(email)
                .map(User::getId)
                .flatMap(technicianRepository::findById)
                .ifPresent((Technician technician) ->
                        technician.replaceSkills(Arrays.stream(skillNames).map(skills::get).toList()));
    }
}
