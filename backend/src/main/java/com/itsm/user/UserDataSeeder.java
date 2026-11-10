package com.itsm.user;

import com.itsm.user.dto.CreateUserRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Creates demo users on first start (only when the users table is empty).
 * Turn off with app.seed.enabled=false. Later phases add their own seeders (catalog, incidents)
 * with a higher @Order so they run after this one.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class UserDataSeeder implements CommandLineRunner {

    public static final String DEMO_PASSWORD = "Password@123";

    private final UserRepository userRepository;
    private final UserFactory userFactory;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        List<CreateUserRequest> demoUsers = List.of(
                admin("Anita Rao", "admin@itsm.com"),

                technician("Ravi Kumar", "ravi.kumar@itsm.com", true, 6, 9),
                technician("Fatima Khan", "fatima.khan@itsm.com", true, 6, 11),
                technician("Sneha Reddy", "sneha.reddy@itsm.com", false, 5, 4),
                technician("Arjun Mehta", "arjun.mehta@itsm.com", false, 4, 1),

                employee("Rahul Verma", "rahul.verma@itsm.com", "Finance"),
                employee("Divya Nair", "divya.nair@itsm.com", "Human Resources"),
                employee("Kiran Patel", "kiran.patel@itsm.com", "Sales")
        );

        demoUsers.forEach(request -> userRepository.save(userFactory.create(request)));

        log.info("Seeded {} demo users. Log in with any of them using password '{}'. Admin: admin@itsm.com",
                demoUsers.size(), DEMO_PASSWORD);
    }

    private CreateUserRequest admin(String name, String email) {
        return new CreateUserRequest(Role.ADMIN, name, email, DEMO_PASSWORD, null,
                null, null, null, null);
    }

    private CreateUserRequest technician(String name, String email, boolean senior, int maxActive, int years) {
        return new CreateUserRequest(Role.TECHNICIAN, name, email, DEMO_PASSWORD, null,
                null, senior, maxActive, years);
    }

    private CreateUserRequest employee(String name, String email, String department) {
        return new CreateUserRequest(Role.EMPLOYEE, name, email, DEMO_PASSWORD, null,
                department, null, null, null);
    }
}
