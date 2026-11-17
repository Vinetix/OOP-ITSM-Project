package com.itsm.intelligence.ai;

import java.util.List;

/** What the AI is told about one category it may choose. */
public record CategoryOption(String code, String name, String description, List<String> keywords) {
}
