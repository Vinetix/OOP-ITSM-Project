package com.itsm.common.exception;

import org.springframework.http.HttpStatus;

/** 404: an incident, user, service, SLA policy, ... does not exist. */
public class ResourceNotFoundException extends ItsmException {

    public ResourceNotFoundException(String resourceName, Object id) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", resourceName + " with id " + id + " was not found");
    }

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message);
    }
}
