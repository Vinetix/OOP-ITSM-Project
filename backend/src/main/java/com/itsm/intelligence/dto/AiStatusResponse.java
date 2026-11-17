package com.itsm.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Whether AI category suggestions are on, and which provider (absent when off). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiStatusResponse(boolean aiEnabled, String provider) {
}
