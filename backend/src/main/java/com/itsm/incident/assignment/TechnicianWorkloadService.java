package com.itsm.incident.assignment;

import com.itsm.common.exception.ResourceNotFoundException;
import com.itsm.incident.IncidentRepository;
import com.itsm.incident.TechnicianStatusCount;
import com.itsm.incident.assignment.dto.WorkloadResponse;
import com.itsm.incident.state.IncidentStatus;
import com.itsm.user.Technician;
import com.itsm.user.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * How busy is each technician? Used by manual assignment (ensureCanAccept), by AssignmentService
 * to build candidates, and by the workload endpoints.
 * Counts for all technicians come from ONE grouped query, not one query per technician.
 */
@Service
@RequiredArgsConstructor
public class TechnicianWorkloadService {

    /** Statuses in which the technician has finished their work on the incident. */
    private static final Set<IncidentStatus> COMPLETED =
            EnumSet.of(IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.CLOSED);

    private final IncidentRepository incidentRepository;
    private final TechnicianRepository technicianRepository;

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

    /** technicianId -> number of active incidents (technicians with none are absent). */
    @Transactional(readOnly = true)
    public Map<Long, Long> activeCountsByTechnician() {
        return totals(incidentRepository.countByTechnicianAndStatus(IncidentStatus.ACTIVE_WORK));
    }

    /** technicianId -> incidents on this service they resolved (RESOLVED, VERIFIED or CLOSED). */
    @Transactional(readOnly = true)
    public Map<Long, Long> completedCountsOnService(Long serviceId) {
        return totals(incidentRepository.countByTechnicianAndStatusForService(serviceId, COMPLETED));
    }

    /** Admin view: every technician, alphabetical. */
    @Transactional(readOnly = true)
    public List<WorkloadResponse> overview() {
        Map<Long, Map<IncidentStatus, Long>> work = activeWorkByTechnician();
        return technicianRepository.findAllByOrderByFullNameAsc().stream()
                .map(t -> WorkloadResponse.of(t, work.getOrDefault(t.getId(), Map.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkloadResponse forTechnician(Long technicianId) {
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));
        return WorkloadResponse.of(technician, activeWorkByTechnician().getOrDefault(technicianId, Map.of()));
    }

    private Map<Long, Map<IncidentStatus, Long>> activeWorkByTechnician() {
        Map<Long, Map<IncidentStatus, Long>> result = new HashMap<>();
        for (TechnicianStatusCount row : incidentRepository.countByTechnicianAndStatus(IncidentStatus.ACTIVE_WORK)) {
            result.computeIfAbsent(row.getTechnicianId(), id -> new EnumMap<>(IncidentStatus.class))
                    .put(row.getStatus(), row.getTotal());
        }
        return result;
    }

    private static Map<Long, Long> totals(List<TechnicianStatusCount> rows) {
        Map<Long, Long> result = new HashMap<>();
        for (TechnicianStatusCount row : rows) {
            result.merge(row.getTechnicianId(), row.getTotal(), Long::sum);
        }
        return result;
    }
}
