package com.itsm.incident;

import com.itsm.common.domain.BaseEntity;
import com.itsm.user.User;
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
 * A comment or work note on an incident.
 * Composition: the constructor is package-private, so notes can only be created through
 * Incident.addNote(); they are saved and deleted together with their incident.
 */
@Getter
@Entity
@Table(name = "incident_notes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class IncidentNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteType type;

    @Column(nullable = false, length = 2000)
    private String text;

    IncidentNote(Incident incident, User author, NoteType type, String text) {
        this.incident = incident;
        this.author = author;
        this.type = type;
        this.text = text;
    }
}
