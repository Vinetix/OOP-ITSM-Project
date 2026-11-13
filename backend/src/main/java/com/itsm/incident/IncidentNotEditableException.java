package com.itsm.incident;

import com.itsm.common.exception.BusinessRuleViolationException;

/** The incident's current status no longer allows editing details or adding notes. */
public class IncidentNotEditableException extends BusinessRuleViolationException {

    public IncidentNotEditableException(String message) {
        super("INCIDENT_NOT_EDITABLE", message);
    }
}
