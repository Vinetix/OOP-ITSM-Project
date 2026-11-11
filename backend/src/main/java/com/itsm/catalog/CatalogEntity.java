package com.itsm.catalog;

import com.itsm.common.domain.Activatable;
import com.itsm.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Shared base for configurable catalog items (Category, ITService, Skill):
 * each has a unique name, an optional description, and can be deactivated.
 * Inheritance removes the duplication; each subclass adds only what makes it different.
 */
@Getter
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class CatalogEntity extends BaseEntity implements Activatable {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    protected CatalogEntity(String name, String description) {
        applyDetails(name, description);
    }

    public void updateDetails(String name, String description) {
        applyDetails(name, description);
    }

    @Override
    public void activate() {
        this.active = true;
    }

    @Override
    public void deactivate() {
        this.active = false;
    }

    private void applyDetails(String name, String description) {
        this.name = name.trim();
        this.description = (description == null || description.isBlank()) ? null : description.trim();
    }
}
