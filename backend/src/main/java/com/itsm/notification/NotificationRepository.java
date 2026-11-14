package com.itsm.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientId(Long recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndReadAtIsNull(Long recipientId, Pageable pageable);

    long countByRecipientIdAndReadAtIsNull(Long recipientId);

    /** Scoped to the recipient, so nobody can read or mark someone else's notification. */
    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    /** An alert that has been dealt with (e.g. "needs a technician" once assigned) no longer counts as unread. */
    @Modifying
    @Query("update Notification n set n.readAt = :now where n.incidentId = :incidentId and n.type = :type and n.readAt is null")
    int markReadForIncident(@Param("incidentId") Long incidentId, @Param("type") NotificationType type,
                            @Param("now") Instant now);

    @Modifying
    @Query("update Notification n set n.readAt = :now where n.recipient.id = :recipientId and n.readAt is null")
    int markAllRead(@Param("recipientId") Long recipientId, @Param("now") Instant now);
}
