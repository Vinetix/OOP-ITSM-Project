package com.itsm.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 400: input that passes field validation but is still invalid as a whole,
 * e.g. a search where the "from" date is after the "to" date.
 */
public class InvalidRequestException extends ItsmException {

    public InvalidRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message);
    }
}
