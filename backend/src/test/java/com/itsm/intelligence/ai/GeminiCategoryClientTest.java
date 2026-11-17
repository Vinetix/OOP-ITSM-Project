package com.itsm.intelligence.ai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** The Gemini request/response shapes, without calling Google. */
class GeminiCategoryClientTest {

    @Test
    @DisplayName("Request: the prompt as user text, temperature 0, thinking off for Gemini 2.5 Flash")
    void requestBodyFor25Flash() {
        Map<String, Object> body = GeminiCategoryClient.requestBody("PROMPT", "gemini-2.5-flash");
        assertThat(body.get("contents")).isEqualTo(List.of(Map.of("role", "user", "parts", List.of(Map.of("text", "PROMPT")))));
        Map<?, ?> config = (Map<?, ?>) body.get("generationConfig");
        assertThat(config.get("temperature")).isEqualTo(0);
        assertThat(config.get("thinkingConfig")).isEqualTo(Map.of("thinkingBudget", 0));
    }

    @Test
    @DisplayName("Thinking setting depends on the model generation")
    void thinkingConfigPerModel() {
        assertThat(GeminiCategoryClient.thinkingConfig("gemini-2.5-flash-lite")).contains(Map.of("thinkingBudget", 0));
        assertThat(GeminiCategoryClient.thinkingConfig("gemini-3-flash-preview")).contains(Map.of("thinkingLevel", "low"));
        assertThat(GeminiCategoryClient.thinkingConfig("gemini-2.5-pro")).isEmpty();
    }

    @Test
    @DisplayName("Response: joins the text parts of the first candidate, skipping 'thought' parts")
    void extractsText() {
        Map<String, Object> response = Map.of("candidates", List.of(Map.of("content", Map.of("parts", List.of(
                Map.of("text", "thinking...", "thought", true),
                Map.of("text", "NETWORK | VPN drops."))))));
        assertThat(GeminiCategoryClient.extractText(response)).isEqualTo("NETWORK | VPN drops.");
    }

    private static final List<CategoryOption> OPTIONS =
            List.of(new CategoryOption("NETWORK", "Network", null, List.of("vpn")));

    @Test
    @DisplayName("Backup model: when the first model is busy (503), the next one answers")
    void triesBackupModelWhenBusy() {
        List<String> asked = new java.util.ArrayList<>();
        GeminiCategoryClient client = new GeminiCategoryClient(List.of("gemini-a", "gemini-b")) {
            @Override
            String generate(String model, String prompt) {
                asked.add(model);
                if (model.equals("gemini-a")) {
                    throw new IllegalStateException("503 Service Unavailable: \"{ status: UNAVAILABLE }\"");
                }
                return "NETWORK | VPN keeps dropping.";
            }
        };
        assertThat(client.chooseCategory("VPN drops", "", OPTIONS))
                .contains(new AiCategoryChoice("NETWORK", "VPN keeps dropping."));
        assertThat(asked).containsExactly("gemini-a", "gemini-b");
    }

    @Test
    @DisplayName("Other errors (e.g. invalid key) are not retried on another model")
    void otherErrorsNotRetried() {
        List<String> asked = new java.util.ArrayList<>();
        GeminiCategoryClient client = new GeminiCategoryClient(List.of("gemini-a", "gemini-b")) {
            @Override
            String generate(String model, String prompt) {
                asked.add(model);
                throw new IllegalStateException("400 Bad Request: API key not valid");
            }
        };
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> client.chooseCategory("VPN drops", "", OPTIONS))
                .hasMessageContaining("400");
        assertThat(asked).containsExactly("gemini-a");
    }

    @Test
    @DisplayName("Busy, quota and not-found errors are worth trying another model")
    void retryableErrors() {
        assertThat(GeminiCategoryClient.isWorthTryingAnotherModel(new RuntimeException("503 Service Unavailable"))).isTrue();
        assertThat(GeminiCategoryClient.isWorthTryingAnotherModel(new RuntimeException("429 Too Many Requests: RESOURCE_EXHAUSTED"))).isTrue();
        assertThat(GeminiCategoryClient.isWorthTryingAnotherModel(new RuntimeException("404 Not Found: NOT_FOUND"))).isTrue();
        assertThat(GeminiCategoryClient.isWorthTryingAnotherModel(new RuntimeException("400 Bad Request"))).isFalse();
    }

    @Test
    @DisplayName("Response without candidates (e.g. blocked) gives empty text")
    void emptyResponses() {
        assertThat(GeminiCategoryClient.extractText(null)).isEmpty();
        assertThat(GeminiCategoryClient.extractText(Map.of("promptFeedback", Map.of()))).isEmpty();
        assertThat(GeminiCategoryClient.extractText(Map.of("candidates", List.of()))).isEmpty();
    }
}
