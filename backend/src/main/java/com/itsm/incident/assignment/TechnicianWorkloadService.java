package com.itsm.incident.assignment;

import com.itsm.incident.IncidentRepository;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Technician;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Can this technician take one more incident? Used by manual assignment now and by the
 * automatic assignment strategies in Phase 4.
 */
@Service
@RequiredArgsConstructor
public class TechnicianWorkloadService {

    private final IncidentRepository incidentRepository;

    @Transactional(readOnly = true)
    public long activeIncidentCount(Long technicianId) {
        return incidentRepository.countByAssignedTechnicianIdAndStatusIn(technicianId, IncidentStatus.ACTIVE_WORK);
    }

    public boolean canAccept(Technician technician) {
        return technician.isActive() && technician.isAvailable()
                && activeIncidentCount(technician.getId()) < technician.getMaxActiveIncidents();
    }

    /** Throws a specific exception explaining why the technician can't take the incident. */
    public void ensureCanAccept(Technician technician) {
        if (!technician.isActive() || !technician.isAvailable()) {
            throw new TechnicianUnavailableException(technician);
        }
        long active = activeIncidentCount(technician.getId());
        if (active >= technician.getMaxActiveIncidents()) {
            throw new TechnicianWorkloadExceededException(technician, active);
        }
    }
}
