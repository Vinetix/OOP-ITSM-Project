package com.itsm.intelligence.ai;

import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Adapter: makes Google's Gemini REST API ("generateContent") fit our AiCategoryClient interface.
 * Sends one prompt, reads the text answer, and lets CategoryPrompt turn it into a category choice.
 *
 * "Thinking" is switched off (Gemini 2.5 Flash) or set low (Gemini 3.x, e.g. the default gemini-3.8-flash) so
 * answers are fast; the request field differs by model generation, so it is chosen from the model name.
 */
public class GeminiCategoryClient implements AiCategoryClient {

    private final RestClient restClient;
    private final String apiKey;
    private final List<String> models;

    /**
     * @param models the model to use first, then backups tried in order when a model is busy (503),
     *               over quota (429) or not available (404)
     */
    public GeminiCategoryClient(String baseUrl, String apiKey, List<String> models, Duration timeout) {
        if (models.isEmpty()) {
            throw new IllegalArgumentException("At least one Gemini model is required");
        }
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);
        this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
        this.apiKey = apiKey;
        this.models = List.copyOf(models);
    }

    /** For tests: a client that never calls the network (generate() is overridden). */
    GeminiCategoryClient(List<String> models) {
        this.restClient = null;
        this.apiKey = null;
        this.models = List.copyOf(models);
    }

    @Override
    public String provider() {
        return "GEMINI";
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public List<String> models() {
        return models;
    }

    @Override
    public Optional<AiCategoryChoice> chooseCategory(String title, String description, List<CategoryOption> options) {
        String prompt = CategoryPrompt.build(title, description, options);
        Set<String> codes = options.stream().map(CategoryOption::code).collect(Collectors.toSet());
        RuntimeException lastProblem = null;
        for (String model : models) {
            try {
                return CategoryPrompt.parse(generate(model, prompt), codes);
            } catch (RuntimeException e) {
                if (!isWorthTryingAnotherModel(e)) {
                    throw e;
                }
                lastProblem = e; // busy / over quota / not available: try the next model
            }
        }
        throw lastProblem;
    }

    /** One generateContent call; returns the answer text. Overridden in tests. */
    String generate(String model, String prompt) {
        Map<?, ?> response = restClient.post()
                .uri("/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody(prompt, model))
                .retrieve()
                .body(Map.class);
        return extractText(response);
    }

    /** 503 busy, 429 over quota, 404 model not available: another model may still work. */
    static boolean isWorthTryingAnotherModel(RuntimeException e) {
        String message = String.valueOf(e.getMessage());
        return message.startsWith("503") || message.startsWith("429") || message.startsWith("404")
                || message.contains("UNAVAILABLE") || message.contains("RESOURCE_EXHAUSTED") || message.contains("NOT_FOUND");
    }

    static Map<String, Object> requestBody(String prompt, String model) {
        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0);
        thinkingConfig(model).ifPresent(config -> generationConfig.put("thinkingConfig", config));
        return Map.of(
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", generationConfig);
    }

    /** Gemini 2.5 Flash / Flash-Lite: thinkingBudget 0 (off). Gemini 3: thinkingLevel "low". Others: nothing. */
    static Optional<Map<String, Object>> thinkingConfig(String model) {
        if (model.startsWith("gemini-2.5-flash")) {
            return Optional.of(Map.of("thinkingBudget", 0));
        }
        if (model.startsWith("gemini-3")) {
            return Optional.of(Map.of("thinkingLevel", "low"));
        }
        return Optional.empty();
    }

    /** candidates[0].content.parts[*].text, joined; empty string if absent (e.g. a blocked prompt). */
    static String extractText(Map<?, ?> response) {
        if (response == null || !(response.get("candidates") instanceof List<?> candidates) || candidates.isEmpty()) {
            return "";
        }
        if (!(candidates.get(0) instanceof Map<?, ?> candidate) || !(candidate.get("content") instanceof Map<?, ?> content)
                || !(content.get("parts") instanceof List<?> parts)) {
            return "";
        }
        return parts.stream()
                .filter(part -> part instanceof Map<?, ?> map && !Boolean.TRUE.equals(map.get("thought")))
                .map(part -> ((Map<?, ?>) part).get("text"))
                .filter(text -> text instanceof String)
                .map(String.class::cast)
                .collect(Collectors.joining("\n"));
    }
}
