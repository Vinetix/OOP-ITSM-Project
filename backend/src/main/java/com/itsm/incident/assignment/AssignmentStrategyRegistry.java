package com.itsm.incident.assignment;

import com.itsm.common.exception.InvalidRequestException;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Finds a strategy by name. Spring injects every AssignmentStrategy bean (in @Order order), so a new
 * strategy class is picked up automatically: open for extension, closed for modification.
 */
@Component
public class AssignmentStrategyRegistry {

    private final Map<String, AssignmentStrategy> byName;

    public AssignmentStrategyRegistry(List<AssignmentStrategy> strategies) {
        Map<String, AssignmentStrategy> map = new LinkedHashMap<>();
        for (AssignmentStrategy strategy : strategies) {
            if (map.put(strategy.name(), strategy) != null) {
                throw new IllegalStateException("Two assignment strategies are named " + strategy.name());
            }
        }
        this.byName = Collections.unmodifiableMap(map);
    }

    public Optional<AssignmentStrategy> find(String name) {
        return name == null ? Optional.empty() : Optional.ofNullable(byName.get(normalize(name)));
    }

    /** @throws InvalidRequestException (400) for an unknown name */
    public AssignmentStrategy get(String name) {
        return find(name).orElseThrow(() -> new InvalidRequestException(
                "Unknown assignment strategy '" + name + "'. Available: " + String.join(", ", byName.keySet())));
    }

    public Collection<AssignmentStrategy> all() {
        return byName.values();
    }

    private static String normalize(String name) {
        return name.trim().toUpperCase(Locale.ROOT);
    }
}
