package com.itsm.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatusCode;

import java.time.Instant;
import java.util.Map;

/**
 * The single error format for the whole API, so the frontend can always do:
 *   error.response.data.message      -> show to the user
 *   error.response.data.code         -> branch on the type of error
 *   error.response.data.fieldErrors  -> highlight invalid form fields
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY) // omits fieldErrors when there are none
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        Map<String, String> fieldErrors
) {

    public static ApiError of(HttpStatusCode status, String error, String code, String message, String path) {
        return new ApiError(Instant.now(), status.value(), error, code, message, path, Map.of());
    }

    public static ApiError withFieldErrors(HttpStatusCode status, String error, String code, String message,
                                           String path, Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status.value(), error, code, message, path, fieldErrors);
    }
}
