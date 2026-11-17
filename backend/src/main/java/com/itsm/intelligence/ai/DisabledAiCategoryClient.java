package com.itsm.intelligence.ai;

import java.util.List;
import java.util.Optional;

/** Null Object: used when AI is switched off or no API key is configured. Never calls anything. */
public class DisabledAiCategoryClient implements AiCategoryClient {

    @Override
    public String provider() {
        return null;
    }

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public Optional<AiCategoryChoice> chooseCategory(String title, String description, List<CategoryOption> options) {
        return Optional.empty();
    }
}
