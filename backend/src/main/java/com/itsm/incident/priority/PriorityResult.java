package com.itsm.incident.priority;

/** The calculated priority plus the score and a human-readable explanation (shown in the UI and audit log). */
public record PriorityResult(
        Priority priority,
        int score,
        String explanation
) {
}
