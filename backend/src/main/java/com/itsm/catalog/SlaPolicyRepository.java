package com.itsm.catalog;

import com.itsm.incident.priority.Priority;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {

    Optional<SlaPolicy> findByServiceIdAndPriority(Long serviceId, Priority priority);

    Optional<SlaPolicy> findByServiceIsNullAndPriority(Priority priority);

    List<SlaPolicy> findAllByServiceIdOrderByPriorityAsc(Long serviceId);

    boolean existsByServiceIdAndPriority(Long serviceId, Priority priority);

    boolean existsByServiceIsNullAndPriority(Priority priority);
}
