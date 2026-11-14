package com.itsm.notification;

import com.itsm.common.web.PageResponse;
import com.itsm.notification.dto.MarkAllReadResponse;
import com.itsm.notification.dto.NotificationResponse;
import com.itsm.notification.dto.UnreadCountResponse;
import com.itsm.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Every endpoint works only on the logged-in user's own notifications (any role). */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "My in-app notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "My notifications, newest first (?unreadOnly=true for unread only)")
    public PageResponse<NotificationResponse> mine(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return notificationService.mine(me.getId(), unreadOnly, pageable);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Number of my unread notifications (for the bell badge)")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal UserPrincipal me) {
        return new UnreadCountResponse(notificationService.unreadCount(me.getId()));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark one of my notifications as read")
    public NotificationResponse markRead(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return notificationService.markRead(id, me.getId());
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all my notifications as read")
    public MarkAllReadResponse markAllRead(@AuthenticationPrincipal UserPrincipal me) {
        return new MarkAllReadResponse(notificationService.markAllRead(me.getId()));
    }
}
