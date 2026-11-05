package com.itsm.common.domain;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import lombok.Getter;
import org.hibernate.Hibernate;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Common identity and bookkeeping for every entity (User, Incident, ITService, ...).
 *
 * Encapsulation: only getters are exposed. The id, timestamps and version are
 * managed by the database/Hibernate and can never be set by application code.
 */
@Getter
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    /**
     * Optimistic locking: if two technicians update the same incident at the
     * same moment, the second save fails instead of silently overwriting the first.
     */
    @Version
    private Long version;

    /** Two entity objects are equal if they represent the same database row. */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Long otherId = ((BaseEntity) o).getId(); // getter, not field: o may be a Hibernate proxy
        return id != null && id.equals(otherId);
    }

    @Override
    public int hashCode() {
        // Constant per class so the hash doesn't change when the id is assigned on save
        return Hibernate.getClass(this).hashCode();
    }
}
