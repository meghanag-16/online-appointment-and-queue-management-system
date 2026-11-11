package com.mediqueue.dto;

import com.mediqueue.entity.Notification;
import java.time.LocalDateTime;
import java.util.List;

public record NotificationResponse(
        Long notificationId,
        String type,
        String message,
        LocalDateTime timestamp,
        boolean read,
        String deliveryStatus,
        Long appointmentId) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getNotificationId(),
                n.getType() != null ? n.getType().name() : null,
                n.getMessage(),
                n.getTimestamp(),
                n.isRead(),
                n.getDeliveryStatus() != null ? n.getDeliveryStatus().name() : null,
                n.getAppointmentId());
    }

    /** The bell: the latest notifications plus how many are unread in total. */
    public record Inbox(long unreadCount, List<NotificationResponse> items) {}
}
