package com.itsm.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * One suggested category. source says who suggested it; reason is present only for AI suggestions.
 * For an AI suggestion, matchCount / matchedKeywords show any keywords that also matched (often 0 / []).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategorySuggestionResponse(Long categoryId, String code, String name, int matchCount,
                                         List<String> matchedKeywords, SuggestionSource source, String reason) {
}
