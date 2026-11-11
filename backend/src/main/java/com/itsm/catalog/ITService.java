package com.itsm.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * An IT service that incidents can affect (Payment Gateway, VPN, ...).
 * Association: a service may point to a default Category, used to pre-classify
 * incidents reported against it.
 */
@Getter
@Entity
@Table(name = "it_services")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ITService extends CatalogEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BusinessCriticality criticality;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_category_id")
    private Category defaultCategory;

    public ITService(String name, String description, BusinessCriticality criticality, Category defaultCategory) {
        super(name, description);
        this.criticality = criticality;
        this.defaultCategory = defaultCategory;
    }

    public void update(String name, String description, BusinessCriticality criticality, Category defaultCategory) {
        updateDetails(name, description);
        this.criticality = criticality;
        this.defaultCategory = defaultCategory;
    }
}
