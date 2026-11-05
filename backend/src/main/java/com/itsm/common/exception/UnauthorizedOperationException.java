package com.itsm.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 403: the user is logged in but may not do this to this particular object,
 * e.g. a technician resolving an incident assigned to someone else, or an
 * employee viewing another employee's incident. (Role checks like
 * "only ADMIN may call this endpoint" are handled by Spring Security.)
 */
public class UnauthorizedOperationException extends ItsmException {

    public UnauthorizedOperationException(String message) {
        super(HttpStatus.FORBIDDEN, "UNAUTHORIZED_OPERATION", message);
    }
}
