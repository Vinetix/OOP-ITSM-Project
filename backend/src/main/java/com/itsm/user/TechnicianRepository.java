package com.itsm.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {

    List<Technician> findAllByOrderByFullNameAsc();

    /** Candidates for automatic assignment (used from Phase 4). */
    List<Technician> findAllByActiveTrueAndAvailableTrueOrderByFullNameAsc();
}
