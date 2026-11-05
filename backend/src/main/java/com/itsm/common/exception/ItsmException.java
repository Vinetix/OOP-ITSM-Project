package com.itsm.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Root of every business exception in I-ITSM.
 *
 * Each subclass decides its own HTTP status and machine-readable error code.
 * The GlobalExceptionHandler only knows this base type, so a new exception
 * (e.g. TechnicianUnavailableException) needs no change to the handler:
 * that is polymorphism in action.
 */
@Getter
public abstract class ItsmException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    protected ItsmException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
}
