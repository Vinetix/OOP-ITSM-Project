package com.itsm.incident.assignment;

import com.itsm.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * The admin's assignment configuration, stored as a single row so it survives restarts.
 * The strategy is stored by name; AssignmentStrategyRegistry turns the name into the object.
 */
@Getter
@Entity
@Table(name = "assignment_settings")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssignmentSettings extends BaseEntity {

    @Column(nullable = false, length = 40)
    private String activeStrategy;

    /** When true, a new incident is assigned immediately after it is classified (if someone fits). */
    @Column(nullable = false)
    private boolean autoAssignOnReport;

    public AssignmentSettings(String activeStrategy, boolean autoAssignOnReport) {
        this.activeStrategy = activeStrategy;
        this.autoAssignOnReport = autoAssignOnReport;
    }

    /** The caller passes a name already validated by the registry. */
    public void changeStrategy(String strategyName) {
        this.activeStrategy = strategyName;
    }

    public void changeAutoAssignOnReport(boolean enabled) {
        this.autoAssignOnReport = enabled;
    }
}
