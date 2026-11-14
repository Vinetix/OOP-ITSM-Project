package com.itsm.notification.channel;

import com.itsm.notification.NotificationMessage;

/**
 * Strategy: one way of delivering a notification. Adding SMS or push later means one new class
 * implementing this interface, plus one line in NotificationChannelFactory.
 */
public interface NotificationChannel {

    /** e.g. "IN_APP", "EMAIL" (used in logs). */
    String name();

    void deliver(NotificationMessage message);
}
