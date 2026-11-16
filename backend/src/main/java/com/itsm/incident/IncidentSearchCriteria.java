package com.itsm.incident;

import com.itsm.incident.priority.Priority;
import com.itsm.incident.sla.SlaStatus;
import com.itsm.incident.state.IncidentStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * Optional filters for the incident list; null / empty means "no filter". All filters combine with AND,
 * and always on top of the visibility rule (employees: own reports, technicians: own assignments).
 * reportedFrom / reportedTo are whole days in the reports time zone, "to" inclusive.
 */
public record IncidentSearchCriteria(
        List<IncidentStatus> statuses,
        List<Priority> priorities,
        Long categoryId,
        Long serviceId,
        Long technicianId,
        Long reporterId,
        LocalDate reportedFrom,
        LocalDate reportedTo,
        SlaStatus slaStatus,
        Boolean escalatedOnly,
        String text
) {

    public static IncidentSearchCriteria none() {
        return new IncidentSearchCriteria(null, null, null, null, null, null, null, null, null, null, null);
    }
}
