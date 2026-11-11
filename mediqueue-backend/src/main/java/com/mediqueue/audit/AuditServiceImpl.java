package com.mediqueue.audit;

import com.mediqueue.dto.AuditLogResponse;
import com.mediqueue.entity.AuditLog;
import com.mediqueue.entity.User;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.repository.AuditLogRepository;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuditServiceImpl implements AuditService {

    private static final int MAX_LIMIT = 500;

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void record(AuditAction action, String targetType, Object targetId, String details) {
        AuditLog entry = new AuditLog();
        entry.setAction(action.name());
        entry.setTargetType(targetType);
        entry.setTargetId(targetId != null ? String.valueOf(targetId) : null);
        entry.setDetails(details);

        AuthenticatedUser actor = currentActor();
        if (actor != null) {
            entry.setActorId(actor.userId());
            entry.setActorRole(actor.role().name());
            entry.setActorName(
                    userRepository
                            .findById(actor.userId())
                            .map(User::getName)
                            .orElse(actor.username()));
        } else {
            entry.setActorName("System");
            entry.setActorRole("SYSTEM");
        }
        auditLogRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> search(
            String action, LocalDate from, LocalDate to, String text, int limit) {
        String act = blankToNull(action);
        if (act != null) {
            String upper = act.toUpperCase(Locale.ROOT);
            if (Arrays.stream(AuditAction.values()).noneMatch(a -> a.name().equals(upper))) {
                throw new BadRequestException("Unknown audit action: " + action);
            }
            act = upper;
        }
        if (from != null && to != null && to.isBefore(from)) {
            throw new BadRequestException("The 'to' date must not be before the 'from' date");
        }
        int size = Math.max(1, Math.min(limit, MAX_LIMIT));
        return auditLogRepository
                .search(
                        act,
                        from != null ? from.atStartOfDay() : null,
                        to != null ? to.plusDays(1).atStartOfDay() : null,
                        blankToNull(text),
                        PageRequest.of(0, size))
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    private static AuthenticatedUser currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof AuthenticatedUser u ? u : null;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
