package com.itsm.incident.assignment;

import com.itsm.common.exception.InvalidRequestException;
import com.itsm.incident.assignment.dto.AssignmentSettingsResponse;
import com.itsm.incident.assignment.dto.StrategyInfo;
import com.itsm.incident.assignment.dto.UpdateAssignmentSettingsRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Reads and changes the active assignment strategy and the auto-assign switch.
 * The settings row is created with defaults (SMART, auto-assign on) the first time it is needed.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AssignmentSettingsService {

    public static final String DEFAULT_STRATEGY = SmartScoreAssignmentStrategy.NAME;

    private final AssignmentSettingsRepository repository;
    private final AssignmentStrategyRegistry registry;

    public AssignmentSettingsResponse get() {
        return toResponse(current());
    }

    /** Null fields are left unchanged. */
    public AssignmentSettingsResponse update(UpdateAssignmentSettingsRequest request) {
        if (request.strategy() == null && request.autoAssignOnReport() == null) {
            throw new InvalidRequestException("Provide strategy and/or autoAssignOnReport");
        }
        AssignmentSettings settings = current();
        if (request.strategy() != null) {
            settings.changeStrategy(registry.get(request.strategy()).name());
        }
        if (request.autoAssignOnReport() != null) {
            settings.changeAutoAssignOnReport(request.autoAssignOnReport());
        }
        AssignmentSettings saved = repository.saveAndFlush(settings); // flush so updatedAt is current
        log.info("Assignment settings changed: strategy={}, autoAssignOnReport={}",
                saved.getActiveStrategy(), saved.isAutoAssignOnReport());
        return toResponse(saved);
    }

    public AssignmentStrategy activeStrategy() {
        String name = current().getActiveStrategy();
        return registry.find(name).orElseGet(() -> {
            log.warn("Stored assignment strategy '{}' no longer exists; using {}", name, DEFAULT_STRATEGY);
            return registry.get(DEFAULT_STRATEGY);
        });
    }

    public boolean isAutoAssignOnReport() {
        return current().isAutoAssignOnReport();
    }

    /** Also used by the demo data seeder, which assigns its incidents by hand. */
    public void changeAutoAssignOnReport(boolean enabled) {
        current().changeAutoAssignOnReport(enabled);
    }

    private AssignmentSettings current() {
        return repository.findFirstByOrderByIdAsc()
                .orElseGet(() -> repository.save(new AssignmentSettings(DEFAULT_STRATEGY, true)));
    }

    private AssignmentSettingsResponse toResponse(AssignmentSettings settings) {
        String active = activeStrategyName(settings);
        List<StrategyInfo> strategies = registry.all().stream()
                .map(s -> new StrategyInfo(s.name(), s.description(), s.name().equals(active)))
                .toList();
        return new AssignmentSettingsResponse(active, settings.isAutoAssignOnReport(), settings.getUpdatedAt(), strategies);
    }

    private String activeStrategyName(AssignmentSettings settings) {
        return registry.find(settings.getActiveStrategy()).map(AssignmentStrategy::name).orElse(DEFAULT_STRATEGY);
    }
}
