package com.itsm.catalog;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * A technical skill (e.g. "PostgreSQL Administration") that belongs to one Category.
 * Technicians hold many skills; the skill-based assignment strategy (Phase 4) matches
 * an incident's category against the categories of a technician's skills.
 */
@Getter
@Entity
@Table(name = "skills")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Skill extends CatalogEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    public Skill(String name, String description, Category category) {
        super(name, description);
        this.category = category;
    }

    public void update(String name, String description, Category category) {
        updateDetails(name, description);
        this.category = category;
    }
}
