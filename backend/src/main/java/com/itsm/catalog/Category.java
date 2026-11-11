package com.itsm.catalog;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Incident category (NETWORK, DATABASE, ...). Stored as data, not as a Java enum,
 * so an admin can add a new category at runtime without changing any code.
 *
 * Keywords are a composition: they belong to the category and are stored/deleted with it.
 * They power automatic category suggestion from the incident description.
 */
@Getter
@Entity
@Table(name = "categories")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category extends CatalogEntity {

    /** Stable machine identifier, e.g. "NETWORK". Cannot change after creation. */
    @Column(nullable = false, unique = true, length = 30, updatable = false)
    private String code;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "category_keywords", joinColumns = @JoinColumn(name = "category_id"))
    @Column(name = "keyword", nullable = false, length = 50)
    private Set<String> keywords = new HashSet<>();

    public Category(String code, String name, String description, Collection<String> keywords) {
        super(name, description);
        this.code = code.trim().toUpperCase(Locale.ROOT);
        applyKeywords(keywords);
    }

    /** Read-only view: callers can't modify the set behind the entity's back. */
    public Set<String> getKeywords() {
        return Collections.unmodifiableSet(keywords);
    }

    public void replaceKeywords(Collection<String> newKeywords) {
        applyKeywords(newKeywords);
    }

    private void applyKeywords(Collection<String> newKeywords) {
        keywords.clear();
        if (newKeywords == null) {
            return;
        }
        newKeywords.stream()
                .filter(Objects::nonNull)
                .map(k -> k.trim().toLowerCase(Locale.ROOT))
                .filter(k -> !k.isEmpty())
                .forEach(keywords::add);
    }
}
