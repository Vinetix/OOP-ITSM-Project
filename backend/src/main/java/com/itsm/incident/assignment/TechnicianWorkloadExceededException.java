package com.itsm.incident.assignment;

import com.itsm.common.exception.BusinessRuleViolationException;
import com.itsm.user.Technician;

/** The technician already has their maximum number of active incidents. */
public class TechnicianWorkloadExceededException extends BusinessRuleViolationException {

    public TechnicianWorkloadExceededException(Technician technician, long activeIncidents) {
        super("TECHNICIAN_WORKLOAD_EXCEEDED", technician.getFullName() + " already has " + activeIncidents
                + " active incidents (limit " + technician.getMaxActiveIncidents() + ")");
    }
}
