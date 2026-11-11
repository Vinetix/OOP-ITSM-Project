package com.itsm.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ITServiceRepository extends JpaRepository<ITService, Long> {

    List<ITService> findAllByOrderByNameAsc();

    List<ITService> findAllByActiveTrueOrderByNameAsc();

    Optional<ITService> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
