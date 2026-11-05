package com.itsm.common.exception;

import org.springframework.http.HttpStatus;

/** 409: something unique already exists (e.g. a user with the same email). */
public class DuplicateResourceException extends ItsmException {

    public DuplicateResourceException(String message) {
        super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", message);
    }
}
