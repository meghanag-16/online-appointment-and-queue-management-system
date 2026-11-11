package com.mediqueue.service;

import com.mediqueue.dto.AlertRequest;
import com.mediqueue.dto.NotificationResponse;

import java.time.LocalDateTime;

public interface NotificationService {

    /** The logged-in user's latest notifications and unread count. */
    NotificationResponse.Inbox myInbox(int limit);

    NotificationResponse markRead(Long notificationId);

    int markAllRead();

    /** Administrator: a general alert to one user or to every active user of a role. Returns how many were sent. */
    int sendAlert(AlertRequest request);

    /** Sends one reminder for each live appointment starting within the reminder window after {@code now}. */
    int sendDueReminders(LocalDateTime now);
}
