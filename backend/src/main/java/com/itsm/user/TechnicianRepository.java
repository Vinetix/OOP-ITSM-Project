package com.itsm.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {

    /** @EntityGraph loads each technician's skills (and their categories) in the same query. */
    @EntityGraph(attributePaths = {"skills", "skills.category"})
    List<Technician> findAllByOrderByFullNameAsc();

    /** Candidates for automatic assignment (used from Phase 4). */
    @EntityGraph(attributePaths = {"skills", "skills.category"})
    List<Technician> findAllByActiveTrueAndAvailableTrueOrderByFullNameAsc();
}
