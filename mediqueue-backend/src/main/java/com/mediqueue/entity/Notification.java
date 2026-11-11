package com.mediqueue.entity;

import com.mediqueue.entity.enums.DeliveryStatus;
import com.mediqueue.entity.enums.NotificationType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * One message to one user. Every notification is stored (so it shows in the user's bell) together
 * with the result of handing it to the delivery channel (email/SMS sender).
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private NotificationType type;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status")
    private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    /** The appointment this is about, if any (used so a reminder is sent only once). */
    @Column(name = "appointment_id")
    private Long appointmentId;

    /** Which sender delivered it, e.g. "CONSOLE" or "EMAIL". */
    @Column(name = "channel", length = 20)
    private String channel;

    public Notification() {}

    public Long getNotificationId() { return notificationId; }
    public void setNotificationId(Long notificationId) { this.notificationId = notificationId; }

    public User getRecipient() { return recipient; }
    public void setRecipient(User recipient) { this.recipient = recipient; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public DeliveryStatus getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(DeliveryStatus deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    @PrePersist
    public void prePersist() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
