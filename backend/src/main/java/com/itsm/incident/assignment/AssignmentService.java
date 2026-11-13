package com.itsm.incident.assignment;

import com.itsm.incident.Incident;
import com.itsm.incident.assignment.dto.IneligibleTechnician;
import com.itsm.incident.assignment.dto.RecommendationResponse;
import com.itsm.user.Technician;
import com.itsm.user.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds the candidate list for an incident and lets a strategy rank it.
 * IncidentService calls this; this class never calls IncidentService (no circular dependency),
 * and it never changes an incident itself.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AssignmentService {

    private final TechnicianRepository technicianRepository;
    private final TechnicianWorkloadService workloadService;
    private final AssignmentSettingsService settingsService;
    private final AssignmentStrategyRegistry registry;

    public boolean isAutoAssignOnReport() {
        return settingsService.isAutoAssignOnReport();
    }

    /** The active strategy's best technician for this incident, or the reason there is none. */
    public AssignmentProposal propose(Incident incident) {
        AssignmentStrategy strategy = settingsService.activeStrategy();
        CandidatePool pool = poolFor(incident);
        List<RankedCandidate> ranking = strategy.rank(pool.context());
        if (ranking.isEmpty()) {
            return AssignmentProposal.none(strategy.name(), pool.whyEmpty(strategy));
        }
        RankedCandidate best = ranking.get(0);
        return AssignmentProposal.of(strategy.name(), pool.technician(best.technicianId()), best);
    }

    /** Full ranking for the admin, by the given strategy or (null) the active one. Changes nothing. */
    public RecommendationResponse recommend(Incident incident, String strategyName) {
        AssignmentStrategy active = settingsService.activeStrategy();
        AssignmentStrategy strategy = (strategyName == null || strategyName.isBlank()) ? active : registry.get(strategyName);
        CandidatePool pool = poolFor(incident);
        List<RankedCandidate> ranking = strategy.rank(pool.context());
        AssignmentContext context = pool.context();
        return new RecommendationResponse(incident.getId(), incident.getNumber(), incident.getPriority(),
                context.categoryCode(), context.serviceName(), strategy.name(), strategy.name().equals(active.name()),
                ranking, pool.unavailable(), ranking.isEmpty() ? pool.whyEmpty(strategy) : null);
    }

    // ---------------- building the candidate pool ----------------

    private CandidatePool poolFor(Incident incident) {
        Map<Long, Long> activeCounts = workloadService.activeCountsByTechnician();
        Map<Long, Long> history = workloadService.completedCountsOnService(incident.getService().getId());

        Map<Long, Technician> available = new LinkedHashMap<>();
        List<CandidateProfile> profiles = new ArrayList<>();
        List<IneligibleTechnician> unavailable = new ArrayList<>();

        for (Technician technician : technicianRepository.findAllByOrderByFullNameAsc()) {
            long active = activeCounts.getOrDefault(technician.getId(), 0L);
            String reason = unavailableReason(technician, active, incident);
            if (reason != null) {
                unavailable.add(new IneligibleTechnician(technician.getId(), technician.getFullName(), reason));
                continue;
            }
            available.put(technician.getId(), technician);
            profiles.add(new CandidateProfile(technician.getId(), technician.getFullName(), technician.isSenior(),
                    technician.getExperienceYears(), active, technician.getMaxActiveIncidents(),
                    technician.hasSkillIn(incident.getCategory()), history.getOrDefault(technician.getId(), 0L)));
        }

        String categoryCode = incident.getCategory() == null ? "UNCATEGORISED" : incident.getCategory().getCode();
        AssignmentContext context = new AssignmentContext(incident.getId(), categoryCode,
                incident.getService().getName(), incident.getPriority(), profiles);
        return new CandidatePool(context, available, unavailable);
    }

    /** Null when the technician can take this incident. */
    private static String unavailableReason(Technician technician, long active, Incident incident) {
        if (incident.isAssignedTo(technician.getId())) {
            return "already assigned to this incident";
        }
        if (incident.isReportedBy(technician.getId())) {
            return "reported this incident";
        }
        if (!technician.isActive()) {
            return "account deactivated";
        }
        if (!technician.isAvailable()) {
            return "marked unavailable";
        }
        if (active >= technician.getMaxActiveIncidents()) {
            return "at workload limit (" + active + "/" + technician.getMaxActiveIncidents() + ")";
        }
        return null;
    }

    private record CandidatePool(AssignmentContext context, Map<Long, Technician> available,
                                 List<IneligibleTechnician> unavailable) {

        Technician technician(Long id) {
            return available.get(id);
        }

        String whyEmpty(AssignmentStrategy strategy) {
            if (!context.candidates().isEmpty()) {
                return strategy.explainNoMatch(context);
            }
            if (unavailable.isEmpty()) {
                return "there are no technicians";
            }
            return "no technician can take more work right now ("
                    + unavailable.stream().map(t -> t.fullName() + ": " + t.reason()).collect(Collectors.joining("; "))
                    + ")";
        }
    }
}
