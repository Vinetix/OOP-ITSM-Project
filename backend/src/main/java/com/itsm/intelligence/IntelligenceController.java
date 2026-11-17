package com.itsm.intelligence;

import com.itsm.intelligence.dto.AiStatusResponse;
import com.itsm.intelligence.dto.CategorySuggestionResponse;
import com.itsm.intelligence.dto.SimilarIncidentResponse;
import com.itsm.intelligence.dto.TextCheckRequest;
import com.itsm.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Intelligence", description = "Duplicate detection and category suggestion")
public class IntelligenceController {

    private final IntelligenceService intelligenceService;

    @PostMapping("/api/intelligence/duplicates/check")
    @Operation(summary = "Before reporting: recent, not-closed incidents similar to this text (any role)")
    public List<SimilarIncidentResponse> checkDuplicates(@Valid @RequestBody TextCheckRequest request) {
        return intelligenceService.checkDuplicates(request);
    }

    @PostMapping("/api/intelligence/category-suggestion")
    @Operation(summary = "Suggested categories for this text, best first (any role). With AI on, the first item is the "
            + "AI's pick (source AI, with a reason), followed by keyword suggestions (source KEYWORDS)")
    public List<CategorySuggestionResponse> suggestCategories(@Valid @RequestBody TextCheckRequest request) {
        return intelligenceService.suggestCategories(request);
    }

    @GetMapping("/api/intelligence/status")
    @Operation(summary = "Whether AI category suggestions are on, and the provider (any logged-in role)")
    public AiStatusResponse aiStatus() {
        return intelligenceService.aiStatus();
    }

    @GetMapping("/api/incidents/{id}/similar")
    @Operation(summary = "ADMIN or assigned technician: incidents similar to this one (possible duplicates)")
    public List<SimilarIncidentResponse> similar(@AuthenticationPrincipal UserPrincipal me, @PathVariable("id") Long id) {
        return intelligenceService.similarTo(id, me);
    }
}
