package com.mediqueue.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps every exception to the right HTTP status with the real reason, so the UI can show
 * why something failed instead of a generic "unexpected error".
 *
 * 400 bad input, 401 not logged in, 403 not allowed, 404 not found, 405 wrong method,
 * 409 duplicate/conflict, 413 file too large, 415 wrong content type, 422 slot unavailable,
 * 500 real bugs only (logged with a stack trace).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 400 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex,
                                                                HttpServletRequest req) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(fe -> fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        String summary = fieldErrors.isEmpty()
            ? "Validation failed"
            : fieldErrors.values().iterator().next();
        Map<String, Object> body = ErrorResponses.body(HttpStatus.BAD_REQUEST, summary, req.getRequestURI());
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex,
                                                                HttpServletRequest req) {
        String msg = ex.getConstraintViolations().stream()
            .map(ConstraintViolation::getMessage).findFirst().orElse("Validation failed");
        return error(HttpStatus.BAD_REQUEST, msg, req);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex,
                                                                HttpServletRequest req) {
        String msg = "Malformed request body";
        Throwable cause = ex.getMostSpecificCause();
        String causeMsg = cause != null ? cause.getMessage() : null;
        if (causeMsg != null && causeMsg.contains("not one of the values accepted")) {
            msg = "Invalid value: " + causeMsg.replaceAll("(?s)\\s*at \\[Source.*", "");
        } else if (causeMsg != null && causeMsg.contains("Text '")) {
            msg = "Invalid date or number format";
        }
        return error(HttpStatus.BAD_REQUEST, msg, req);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                                  HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST,
            "Invalid value '" + ex.getValue() + "' for parameter '" + ex.getName() + "'", req);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(MissingServletRequestParameterException ex,
                                                                  HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, "Missing required parameter '" + ex.getParameterName() + "'", req);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, Object>> handleMissingPart(MissingServletRequestPartException ex,
                                                                 HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, "Missing required file part '" + ex.getRequestPartName() + "'", req);
    }

    @ExceptionHandler({BadRequestException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), req);
    }

    // ── 401 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
    public ResponseEntity<Map<String, Object>> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage(), req);
    }

    // ── 403 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler({ForbiddenException.class, AccountInactiveException.class})
    public ResponseEntity<Map<String, Object>> handleForbidden(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage(), req);
    }

    /** @PreAuthorize role failures (AuthorizationDeniedException extends AccessDeniedException). */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return error(HttpStatus.FORBIDDEN, "Access denied: your role cannot perform this action", req);
    }

    // ── 404 / 405 / 415 ─────────────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), req);
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNoEndpoint(Exception ex, HttpServletRequest req) {
        return error(HttpStatus.NOT_FOUND, "Endpoint not found: " + req.getMethod() + " " + req.getRequestURI(), req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethod(HttpRequestMethodNotSupportedException ex,
                                                            HttpServletRequest req) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, "Method " + ex.getMethod() + " is not supported here", req);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMediaType(HttpMediaTypeNotSupportedException ex,
                                                               HttpServletRequest req) {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type: " + ex.getContentType(), req);
    }

    // ── 409 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateResourceException ex, HttpServletRequest req) {
        return error(HttpStatus.CONFLICT, ex.getMessage(), req);
    }

    /** DB unique/foreign-key violations: never leak the raw SQL text to the client. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex,
                                                               HttpServletRequest req) {
        String raw = String.valueOf(ex.getMostSpecificCause().getMessage());
        log.warn("Data integrity violation on {}: {}", req.getRequestURI(), raw);
        String msg = raw.toLowerCase().contains("duplicate")
            ? "A record with the same unique value already exists"
            : "The request conflicts with existing data";
        return error(HttpStatus.CONFLICT, msg, req);
    }

    // ── 413 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleTooLarge(MaxUploadSizeExceededException ex,
                                                              HttpServletRequest req) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "File is too large (maximum 10 MB)", req);
    }

    // ── 422 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler(SlotUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleSlotUnavailable(SlotUnavailableException ex,
                                                                     HttpServletRequest req) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), req);
    }

    // ── explicit statuses ───────────────────────────────────────────────────
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex, HttpServletRequest req) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        return error(status, ex.getReason() != null ? ex.getReason() : status.getReasonPhrase(), req);
    }

    // ── 500 (real bugs only) ────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest req) {
        log.error("Unhandled error on {} {}", req.getMethod(), req.getRequestURI(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", req);
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message, HttpServletRequest req) {
        return ResponseEntity.status(status).body(ErrorResponses.body(status, message, req.getRequestURI()));
    }
}
