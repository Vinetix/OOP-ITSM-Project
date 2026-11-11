package com.itsm.catalog;

/**
 * How important an IT service is to the business. The weight feeds the
 * priority calculation in Phase 4 (Impact x Urgency x Business criticality).
 */
public enum BusinessCriticality {
    LOW(1, "Low"),
    MEDIUM(2, "Medium"),
    HIGH(3, "High"),
    CRITICAL(4, "Critical");

    private final int weight;
    private final String label;

    BusinessCriticality(int weight, String label) {
        this.weight = weight;
        this.label = label;
    }

    public int getWeight() {
        return weight;
    }

    public String getLabel() {
        return label;
    }
}
