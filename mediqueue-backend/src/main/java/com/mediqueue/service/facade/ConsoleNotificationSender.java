package com.mediqueue.service.facade;

import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.NotificationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Development sender: writes what would be emailed/texted to the server log. */
@Component
public class ConsoleNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(ConsoleNotificationSender.class);

    @Override
    public String channel() {
        return "CONSOLE";
    }

    @Override
    public void send(User recipient, NotificationType type, String message) {
        log.info(
                "[Notification] {} to {} <{}> phone {}: {}",
                type,
                recipient.getName(),
                recipient.getEmail(),
                recipient.getPhoneNumber(),
                message);
    }
}
