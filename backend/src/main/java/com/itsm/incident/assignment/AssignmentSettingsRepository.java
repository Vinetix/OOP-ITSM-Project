package com.itsm.incident.assignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssignmentSettingsRepository extends JpaRepository<AssignmentSettings, Long> {

    /** The table holds a single row. */
    Optional<AssignmentSettings> findFirstByOrderByIdAsc();
}
