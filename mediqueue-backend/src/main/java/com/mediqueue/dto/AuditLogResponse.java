package com.mediqueue.dto;

import com.mediqueue.entity.AuditLog;
import java.time.LocalDateTime;

public record AuditLogResponse(
        Long auditId,
        LocalDateTime createdAt,
        String actorId,
        String actorName,
        String actorRole,
        String action,
        String targetType,
        String targetId,
        String details) {
    public static AuditLogResponse from(AuditLog a) {
        return new AuditLogResponse(
                a.getAuditId(),
                a.getCreatedAt(),
                a.getActorId(),
                a.getActorName(),
                a.getActorRole(),
                a.getAction(),
                a.getTargetType(),
                a.getTargetId(),
                a.getDetails());
    }
}
