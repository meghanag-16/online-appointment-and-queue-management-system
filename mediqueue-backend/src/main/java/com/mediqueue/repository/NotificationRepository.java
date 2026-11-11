package com.mediqueue.repository;

import com.mediqueue.entity.Notification;
import com.mediqueue.entity.enums.NotificationType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipient_UserIdOrderByTimestampDescNotificationIdDesc(String userId, Pageable page);
    long countByRecipient_UserIdAndReadFalse(String userId);
    boolean existsByAppointmentIdAndType(Long appointmentId, NotificationType type);
    List<Notification> findByAppointmentIdAndType(Long appointmentId, NotificationType type);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipient.userId = :userId and n.read = false")
    int markAllRead(@Param("userId") String userId);
}
