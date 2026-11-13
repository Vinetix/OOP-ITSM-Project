package com.itsm.incident.priority;

/** How quickly the problem needs fixing. Weight 1-4 feeds the priority score. */
public enum Urgency {
    LOW(1, "Can wait; a workaround exists"),
    MEDIUM(2, "Work is slowed down"),
    HIGH(3, "Work is blocked"),
    CRITICAL(4, "Immediate business or financial loss");

    private final int weight;
    private final String description;

    Urgency(int weight, String description) {
        this.weight = weight;
        this.description = description;
    }

    public int getWeight() {
        return weight;
    }

    public String getDescription() {
        return description;
    }
}
