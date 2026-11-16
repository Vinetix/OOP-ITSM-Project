package com.itsm.intelligence.dto;

import java.util.List;

public record CategorySuggestionResponse(Long categoryId, String code, String name, int matchCount,
                                         List<String> matchedKeywords) {
}
