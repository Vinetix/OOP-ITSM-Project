package com.itsm.intelligence.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Chooses the AI adapter at startup. With app.ai.gemini.api-key set (in application-local.properties,
 * never in Git) Gemini is used; without it, AI is off and category suggestions use keywords only.
 */
@Slf4j
@Configuration
public class AiConfig {

    @Bean
    public AiCategoryClient aiCategoryClient(
            @Value("${app.ai.enabled:true}") boolean enabled,
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-3.8-flash}") String model,
            @Value("${app.ai.gemini.fallback-models:}") String fallbackModels,
            @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${app.ai.timeout-ms:4000}") long timeoutMs) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            log.info("AI category suggestion: OFF ({}), using keyword matching",
                    enabled ? "no app.ai.gemini.api-key set" : "app.ai.enabled=false");
            return new DisabledAiCategoryClient();
        }
        List<String> models = new ArrayList<>();
        models.add(model.strip());
        Arrays.stream(fallbackModels.split(",")).map(String::strip).filter(m -> !m.isEmpty() && !models.contains(m))
                .forEach(models::add);
        log.info("AI category suggestion: GEMINI ({}), timeout {} ms, keyword fallback on any problem",
                String.join(" → ", models), timeoutMs);
        return new GeminiCategoryClient(baseUrl, apiKey.strip(), models, Duration.ofMillis(timeoutMs));
    }
}
