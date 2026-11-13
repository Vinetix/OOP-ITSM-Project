package com.itsm.incident;

import com.itsm.incident.state.IncidentStatus;

/** One row of a grouped count: how many incidents a technician has in one status. */
public interface TechnicianStatusCount {

    Long getTechnicianId();

    IncidentStatus getStatus();

    Long getTotal();
}
