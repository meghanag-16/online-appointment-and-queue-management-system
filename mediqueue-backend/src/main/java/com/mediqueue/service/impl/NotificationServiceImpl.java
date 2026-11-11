package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.AlertRequest;
import com.mediqueue.dto.NotificationResponse;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Notification;
import com.mediqueue.entity.User;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.NotificationRepository;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.security.CurrentUserService;
import com.mediqueue.service.NotificationService;
import com.mediqueue.service.facade.NotificationFacade;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationFacade notificationFacade;
    private final CurrentUserService currentUser;
    private final AuditService auditService;
    private final int reminderHoursBefore;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            NotificationFacade notificationFacade,
            CurrentUserService currentUser,
            AuditService auditService,
            @Value("${app.reminders.hours-before:24}") int reminderHoursBefore) {
        this.notificationRepository = notificationRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.notificationFacade = notificationFacade;
        this.currentUser = currentUser;
        this.auditService = auditService;
        this.reminderHoursBefore = reminderHoursBefore;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse.Inbox myInbox(int limit) {
        String me = currentUser.userId();
        int size = Math.max(1, Math.min(limit, 100));
        List<NotificationResponse> items =
                notificationRepository
                        .findByRecipient_UserIdOrderByTimestampDescNotificationIdDesc(
                                me, PageRequest.of(0, size))
                        .stream()
                        .map(NotificationResponse::from)
                        .toList();
        return new NotificationResponse.Inbox(
                notificationRepository.countByRecipient_UserIdAndReadFalse(me), items);
    }

    @Override
    public NotificationResponse markRead(Long notificationId) {
        Notification n =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Notification not found: " + notificationId));
        if (!n.getRecipient().getUserId().equals(currentUser.userId())) {
            throw new ForbiddenException(
                    "Access denied: this notification belongs to someone else");
        }
        n.setRead(true);
        return NotificationResponse.from(notificationRepository.save(n));
    }

    @Override
    public int markAllRead() {
        return notificationRepository.markAllRead(currentUser.userId());
    }

    @Override
    public int sendAlert(AlertRequest req) {
        boolean hasUser = req.userId() != null && !req.userId().isBlank();
        boolean hasRole = req.role() != null && !req.role().isBlank();
        if (hasUser == hasRole) {
            throw new BadRequestException(
                    "Choose either one user or one role to send the alert to");
        }
        String message = req.message().trim();
        List<User> recipients;
        String target;
        if (hasUser) {
            User user =
                    userRepository
                            .findById(req.userId().trim())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "User not found: " + req.userId()));
            recipients = List.of(user);
            target = user.getUserId();
        } else {
            UserRole role;
            try {
                role = UserRole.valueOf(req.role().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + req.role());
            }
            recipients = userRepository.findByRoleAndAccountStatus(role, AccountStatus.ACTIVE);
            target = role.name();
        }
        recipients.forEach(u -> notificationFacade.generalAlert(u, message, null));
        auditService.record(
                AuditAction.ALERT_SENT,
                hasUser ? "USER" : "ROLE",
                target,
                "Sent to " + recipients.size() + " user(s): " + abbreviate(message));
        return recipients.size();
    }

    @Override
    public int sendDueReminders(LocalDateTime now) {
        List<Appointment> due =
                appointmentRepository.findDueForReminder(
                        EnumSet.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED),
                        now,
                        now.plusHours(reminderHoursBefore));
        due.forEach(notificationFacade::appointmentReminder);
        if (!due.isEmpty()) log.info("[Reminders] Sent {} appointment reminder(s)", due.size());
        return due.size();
    }

    private static String abbreviate(String s) {
        return s.length() <= 80 ? s : s.substring(0, 77) + "...";
    }
}
