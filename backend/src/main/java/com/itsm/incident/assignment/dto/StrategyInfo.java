package com.itsm.incident.assignment.dto;

/** One available assignment strategy, for the admin's strategy picker. */
public record StrategyInfo(String name, String description, boolean active) {
}
