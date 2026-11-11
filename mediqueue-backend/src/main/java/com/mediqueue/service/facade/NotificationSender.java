package com.mediqueue.service.facade;

import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.NotificationType;

/**
 * Delivers a notification outside the app (email, SMS, ...). The development build uses {@link
 * ConsoleNotificationSender}; a real provider is added by writing another implementation and
 * marking it {@code @Primary} — nothing else changes.
 *
 * <p>Throw an exception when delivery fails: the notification is then stored as FAILED.
 */
public interface NotificationSender {

    /** Short channel name stored with each notification, e.g. "CONSOLE", "EMAIL", "SMS". */
    String channel();

    void send(User recipient, NotificationType type, String message);
}
