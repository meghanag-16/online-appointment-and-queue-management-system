package com.mediqueue.audit;

import com.mediqueue.dto.AuditLogResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Writes and reads the audit log. Entries are written inside the caller's transaction, so an
 * action that fails and rolls back leaves no entry behind.
 */
public interface AuditService {

    /** Records an action by the logged-in user (or "System" when there is none, e.g. a scheduled job). */
    void record(AuditAction action, String targetType, Object targetId, String details);

    /** Newest first. Every filter is optional; {@code to} is inclusive. */
    List<AuditLogResponse> search(String action, LocalDate from, LocalDate to, String text, int limit);
}
