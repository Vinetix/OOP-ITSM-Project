package com.itsm.incident.assignment;

import java.util.Comparator;
import java.util.List;

/**
 * Template Method: every strategy ranks the same way (filter -> score -> sort best first);
 * subclasses only decide who is suitable and how to score them.
 */
public abstract class AbstractAssignmentStrategy implements AssignmentStrategy {

    /** Highest score first; ties go to the more experienced technician, then by name (predictable). */
    private static final Comparator<Scored> BEST_FIRST =
            Comparator.comparingInt((Scored s) -> s.score().points()).reversed()
                    .thenComparing(Comparator.comparingInt((Scored s) -> s.candidate().experienceYears()).reversed())
                    .thenComparing((Scored s) -> s.candidate().fullName());

    @Override
    public final List<RankedCandidate> rank(AssignmentContext context) {
        return context.candidates().stream()
                .filter(candidate -> isSuitable(candidate, context))
                .map(candidate -> new Scored(candidate, score(candidate, context)))
                .sorted(BEST_FIRST)
                .map(Scored::toRankedCandidate)
                .toList();
    }

    /** Hook: by default every available technician is considered. */
    protected boolean isSuitable(CandidateProfile candidate, AssignmentContext context) {
        return true;
    }

    /** Score from 0 to 100 (higher is better) plus the reasons shown to the admin. */
    protected abstract CandidateScore score(CandidateProfile candidate, AssignmentContext context);

    private record Scored(CandidateProfile candidate, CandidateScore score) {

        RankedCandidate toRankedCandidate() {
            return new RankedCandidate(candidate.technicianId(), candidate.fullName(), score.points(), score.reasons());
        }
    }
}
