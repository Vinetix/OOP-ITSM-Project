package com.itsm.notification;

import com.itsm.common.domain.BaseEntity;
import com.itsm.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** An in-app notification: one row per recipient, shown in their inbox until read. */
@Getter
@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notification_recipient", columnList = "recipient_id, readAt"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    private Long incidentId;

    @Column(length = 20)
    private String incidentNumber;

    @Column(nullable = false)
    private boolean important;

    private Instant readAt;

    public Notification(NotificationMessage message) {
        this.recipient = message.recipient();
        this.type = message.type();
        this.title = cut(message.title(), 150);
        this.body = cut(message.body(), 1000);
        this.incidentId = message.incidentId();
        this.incidentNumber = message.incidentNumber();
        this.important = message.important();
    }

    public boolean isRead() {
        return readAt != null;
    }

    /** Idempotent: reading twice keeps the first time. */
    public void markRead(Instant now) {
        if (readAt == null) {
            readAt = now;
        }
    }

    private static String cut(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }
}
