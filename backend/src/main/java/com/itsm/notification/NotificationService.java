package com.itsm.notification;

import com.itsm.common.exception.ResourceNotFoundException;
import com.itsm.common.web.PageResponse;
import com.itsm.notification.channel.NotificationChannel;
import com.itsm.notification.channel.NotificationChannelFactory;
import com.itsm.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final NotificationChannelFactory channelFactory;
    private final Clock clock;

    /** Delivers through every channel chosen for the message; one channel failing doesn't stop the others. */
    public void send(NotificationMessage message) {
        for (NotificationChannel channel : channelFactory.channelsFor(message)) {
            try {
                channel.deliver(message);
            } catch (RuntimeException e) {
                log.warn("{} delivery of {} to user {} failed: {}", channel.name(), message.type(),
                        message.recipient().getId(), e.getMessage());
            }
        }
    }

    /** Called once an incident is assigned: the admins' "needs a technician" alerts are resolved. */
    public void resolveUnassignedAlerts(Long incidentId) {
        repository.markReadForIncident(incidentId, NotificationType.INCIDENT_UNASSIGNED, clock.instant());
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> mine(Long userId, boolean unreadOnly, Pageable pageable) {
        Page<Notification> page = unreadOnly
                ? repository.findByRecipientIdAndReadAtIsNull(userId, pageable)
                : repository.findByRecipientId(userId, pageable);
        return PageResponse.from(page.map(NotificationResponse::from));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repository.countByRecipientIdAndReadAtIsNull(userId);
    }

    /** 404 for someone else's notification, so its existence isn't revealed. */
    public NotificationResponse markRead(Long id, Long userId) {
        Notification notification = repository.findByIdAndRecipientId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        notification.markRead(clock.instant());
        return NotificationResponse.from(notification);
    }

    public int markAllRead(Long userId) {
        return repository.markAllRead(userId, clock.instant());
    }
}
