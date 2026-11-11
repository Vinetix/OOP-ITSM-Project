package com.itsm.catalog;

import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.incident.priority.Priority;

/** No SLA policy (service-specific or default) exists for a priority. */
public class SlaConfigurationMissingException extends BusinessRuleViolationException {

    public SlaConfigurationMissingException(Priority priority) {
        super("SLA_CONFIGURATION_MISSING",
                "No SLA policy is configured for priority " + priority + ". An administrator must add one.");
    }
}
