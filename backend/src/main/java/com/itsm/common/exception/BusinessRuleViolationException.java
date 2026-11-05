package com.itsm.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 422: the request is well-formed but breaks a business rule.
 * Domain modules extend this with a more specific error code, e.g.
 * InvalidStateTransitionException, TechnicianWorkloadExceededException,
 * SlaConfigurationMissingException.
 */
public class BusinessRuleViolationException extends ItsmException {

    private static final HttpStatus UNPROCESSABLE = HttpStatus.valueOf(422);

    public BusinessRuleViolationException(String message) {
        super(UNPROCESSABLE, "BUSINESS_RULE_VIOLATION", message);
    }

    /** For subclasses that want their own error code. */
    protected BusinessRuleViolationException(String errorCode, String message) {
        super(UNPROCESSABLE, errorCode, message);
    }
}
