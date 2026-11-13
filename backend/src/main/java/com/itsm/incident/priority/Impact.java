package com.itsm.incident.priority;

/** How widely the problem affects the organisation. Weight 1-4 feeds the priority score. */
public enum Impact {
    LOW(1, "Affects a single user"),
    MEDIUM(2, "Affects a team"),
    HIGH(3, "Affects a department, site or many users"),
    CRITICAL(4, "Affects the whole organisation or customers");

    private final int weight;
    private final String description;

    Impact(int weight, String description) {
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
