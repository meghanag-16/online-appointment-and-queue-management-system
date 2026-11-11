package com.mediqueue.repository;

import com.mediqueue.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Newest first; every filter is optional (null = any). {@code text} matches the actor's name,
     * the target ID or the details.
     */
    @Query(
            """
        select a from AuditLog a
        where (:action is null or a.action = :action)
          and (:from is null or a.createdAt >= :from)
          and (:to is null or a.createdAt < :to)
          and (:text is null
               or lower(a.actorName) like lower(concat('%', :text, '%'))
               or lower(a.targetId) like lower(concat('%', :text, '%'))
               or lower(a.details) like lower(concat('%', :text, '%')))
        order by a.createdAt desc, a.auditId desc
        """)
    List<AuditLog> search(
            @Param("action") String action,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("text") String text,
            Pageable page);
}
