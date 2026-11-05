package com.itsm.common.web;

import com.itsm.common.exception.ItsmException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns every exception into the same ApiError JSON shape.
 * Controllers and services just throw; they never build error responses themselves.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ---------- Our own business exceptions (one handler for the whole hierarchy) ----------

    @ExceptionHandler(ItsmException.class)
    public ResponseEntity<ApiError> handleItsm(ItsmException ex, HttpServletRequest req) {
        log.debug("Business exception [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return build(ex.getStatus(), ex.getErrorCode(), ex.getMessage(), req);
    }

    // ---------- Invalid user input ----------

    /** @Valid on a @RequestBody DTO failed (e.g. blank title, missing email). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleBodyValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        ex.getBindingResult().getGlobalErrors()
                .forEach(ge -> fieldErrors.putIfAbsent(ge.getObjectName(), ge.getDefaultMessage()));
        return buildWithFields(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "One or more fields are invalid", fieldErrors, req);
    }

    /** Validation on @RequestParam / @PathVariable failed (e.g. @Min(1) on a page size). */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiError> handleParamValidation(HandlerMethodValidationException ex, HttpServletRequest req) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (ParameterValidationResult result : ex.getParameterValidationResults()) {
            String name = result.getMethodParameter().getParameterName();
            String message = result.getResolvableErrors().stream()
                    .map(MessageSourceResolvable::getDefaultMessage)
                    .findFirst().orElse("invalid value");
            fieldErrors.putIfAbsent(name != null ? name : "parameter", message);
        }
        return buildWithFields(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "One or more request parameters are invalid", fieldErrors, req);
    }

    /** Validation inside a service annotated with @Validated failed. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v ->
                fieldErrors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        return buildWithFields(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "One or more values are invalid", fieldErrors, req);
    }

    /** Body missing, not JSON, wrong type, or an unknown enum value like "priority":"P9". */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
                "Request body is missing or invalid (check JSON syntax, field types and enum values)", req);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        String message = "Parameter '" + ex.getName() + "' has an invalid value: '" + ex.getValue() + "'";
        return build(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER", message, req);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER",
                "Required parameter '" + ex.getParameterName() + "' is missing", req);
    }

    // ---------- Wrong URL / method ----------

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "ENDPOINT_NOT_FOUND", "No endpoint exists at this path", req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethod(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED",
                "HTTP method " + ex.getMethod() + " is not supported for this path", req);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> handleMediaType(HttpMediaTypeNotSupportedException ex, HttpServletRequest req) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE",
                "Content-Type must be application/json", req);
    }

    // ---------- Security ----------

    /** Wrong email/password at login (thrown by the AuthenticationManager in Phase 1). */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Invalid email or password", req);
    }

    /** Logged in, but the role is not allowed (e.g. EMPLOYEE calling an ADMIN endpoint). */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                "You do not have permission to perform this action", req);
    }

    // ---------- Database ----------

    /** Two users edited the same row at the same time (BaseEntity @Version). */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> handleOptimisticLock(ObjectOptimisticLockingFailureException ex,
                                                         HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION",
                "This record was changed by someone else. Reload and try again.", req);
    }

    /** A database constraint was broken (unique column, foreign key, not-null). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "DATA_CONFLICT",
                "The operation conflicts with existing data", req);
    }

    /** Database down or unreachable ("Database failure" in the brief). */
    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class})
    public ResponseEntity<ApiError> handleDatabase(Exception ex, HttpServletRequest req) {
        log.error("Database error on {} {}", req.getMethod(), req.getRequestURI(), ex);
        return build(HttpStatus.SERVICE_UNAVAILABLE, "DATABASE_UNAVAILABLE",
                "The database is temporarily unavailable. Please try again shortly.", req);
    }

    // ---------- Anything else ----------

    /** Last resort. Logs the full stack trace but never leaks internals to the client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unexpected error on {} {}", req.getMethod(), req.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred", req);
    }

    // ---------- helpers ----------

    private ResponseEntity<ApiError> build(HttpStatus status, String code, String message, HttpServletRequest req) {
        return ResponseEntity.status(status)
                .body(ApiError.of(status, status.getReasonPhrase(), code, message, req.getRequestURI()));
    }

    private ResponseEntity<ApiError> buildWithFields(HttpStatus status, String code, String message,
                                                     Map<String, String> fieldErrors, HttpServletRequest req) {
        return ResponseEntity.status(status)
                .body(ApiError.withFieldErrors(status, status.getReasonPhrase(), code, message,
                        req.getRequestURI(), fieldErrors));
    }
}
