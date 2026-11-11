package com.itsm.common.domain;

/**
 * Contract for anything that is switched off instead of deleted
 * (users, categories, services, skills). Deactivated items stay in the database
 * because old incidents still reference them, but they can't be used for new work.
 */
public interface Activatable {

    boolean isActive();

    void activate();

    void deactivate();
}
