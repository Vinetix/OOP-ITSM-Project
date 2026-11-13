package com.itsm.incident.assignment;

import com.itsm.common.exception.BusinessRuleViolationException;

/** Automatic assignment was requested but no technician fits right now. */
public class NoEligibleTechnicianException extends BusinessRuleViolationException {

    public NoEligibleTechnicianException(String incidentNumber, String reason) {
        super("NO_ELIGIBLE_TECHNICIAN", incidentNumber + " can't be auto-assigned: " + reason
                + ". Assign it manually or switch the assignment strategy.");
    }
}
