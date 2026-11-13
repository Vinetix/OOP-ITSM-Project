package com.itsm.incident.assignment;

import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.user.Technician;

/** The technician is deactivated or has marked themselves unavailable. */
public class TechnicianUnavailableException extends BusinessRuleViolationException {

    public TechnicianUnavailableException(Technician technician) {
        super("TECHNICIAN_UNAVAILABLE", technician.getFullName()
                + (technician.isActive() ? " is currently unavailable" : " has a deactivated account"));
    }

    public TechnicianUnavailableException(String message) {
        super("TECHNICIAN_UNAVAILABLE", message);
    }
}
