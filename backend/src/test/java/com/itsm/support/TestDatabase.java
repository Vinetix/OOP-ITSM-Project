package com.itsm.support;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Where the integration tests get their database: a SEPARATE PostgreSQL database, never the dev "itsm".
 *
 *   URL:      ITSM_TEST_DB_URL       (default jdbc:postgresql://localhost:5432/itsm_test)
 *   user:     ITSM_TEST_DB_USER      (default: spring.datasource.username from application-local.properties)
 *   password: ITSM_TEST_DB_PASSWORD  (default: spring.datasource.password from application-local.properties)
 *
 * If that database can't be reached, the integration tests are SKIPPED (not failed), so the unit tests
 * still run on any machine. Create it once in pgAdmin: CREATE DATABASE itsm_test;
 */
public final class TestDatabase {

    private static final Properties LOCAL = loadLocalProperties();
    private static Boolean available;

    private TestDatabase() {
    }

    public static String url() {
        String url = env("ITSM_TEST_DB_URL", "jdbc:postgresql://localhost:5432/itsm_test");
        String database = url.replaceAll("\\?.*$", "").replaceAll("^.*/", "");
        if (!database.endsWith("_test")) {
            // The tests drop and recreate every table: never let them touch the development database.
            throw new IllegalStateException("Refusing to run tests against '" + database
                    + "': the test database name must end with _test");
        }
        return url;
    }

    public static String username() {
        return env("ITSM_TEST_DB_USER", LOCAL.getProperty("spring.datasource.username", "postgres"));
    }

    public static String password() {
        return env("ITSM_TEST_DB_PASSWORD", LOCAL.getProperty("spring.datasource.password", "postgres"));
    }

    /** Used by @EnabledIf on @IntegrationTest. */
    public static synchronized boolean isAvailable() {
        if (available == null) {
            DriverManager.setLoginTimeout(3);
            try (Connection ignored = DriverManager.getConnection(url(), username(), password())) {
                available = true;
            } catch (SQLException e) {
                System.err.println("Integration tests skipped: can't connect to " + url() + " (" + e.getMessage()
                        + "). Create it with: CREATE DATABASE itsm_test;");
                available = false;
            }
        }
        return available;
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static Properties loadLocalProperties() {
        Properties properties = new Properties();
        try (InputStream in = TestDatabase.class.getClassLoader().getResourceAsStream("application-local.properties")) {
            if (in != null) {
                properties.load(in);
            }
        } catch (IOException ignored) {
            // fall back to defaults
        }
        return properties;
    }
}
