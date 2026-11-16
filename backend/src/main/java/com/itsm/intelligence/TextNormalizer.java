package com.itsm.intelligence;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Turns free text into a set of comparable words:
 *   lower case → punctuation becomes spaces → common filler words removed → simple word endings trimmed.
 * "Payments are FAILING at checkout!" → {payment, fail, checkout}
 *
 * Deliberately simple and explainable (no external NLP library). The same normalisation is applied to
 * incident text and to category keywords, so they always compare like with like.
 */
public final class TextNormalizer {

    /** Words that carry no meaning for matching incidents. */
    static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "am", "to", "of", "in", "on", "at",
            "for", "from", "with", "and", "or", "but", "not", "no", "it", "its", "this", "that", "these", "those",
            "my", "our", "your", "i", "we", "you", "they", "he", "she", "me", "us", "them", "can", "cannot", "cant",
            "could", "would", "should", "will", "wont", "unable", "able", "get", "gets", "got", "getting", "all",
            "any", "some", "after", "before", "when", "while", "since", "very", "too", "also", "just", "only",
            "still", "again", "now", "today", "yesterday", "around", "about", "has", "have", "had", "do", "does",
            "did", "doesnt", "dont", "isnt", "there", "here", "what", "which", "who", "as", "by", "so", "if",
            "then", "than", "out", "up", "down", "into", "over", "more", "most", "other", "issue", "issues",
            "problem", "problems", "please", "help", "working", "work", "works", "make", "making", "every",
            "everyone", "users", "user", "people", "keep", "keeps");

    private TextNormalizer() {
    }

    public static Set<String> words(String text) {
        Set<String> result = new LinkedHashSet<>();
        if (text == null) {
            return result;
        }
        String cleaned = text.toLowerCase(Locale.ROOT).replace("'", "").replaceAll("[^a-z0-9]+", " ");
        for (String token : cleaned.trim().split(" ")) {
            if (token.length() < 2 || STOP_WORDS.contains(token)) {
                continue;
            }
            result.add(stem(token));
        }
        return result;
    }

    /** Very small suffix stripper: queries→query, denied→deny, failing→fail, payments→payment. */
    static String stem(String word) {
        if (word.length() > 4 && (word.endsWith("ies") || word.endsWith("ied"))) {
            return word.substring(0, word.length() - 3) + "y";
        }
        if (word.length() > 5 && word.endsWith("ing")) {
            return word.substring(0, word.length() - 3);
        }
        if (word.length() > 4 && word.endsWith("ed")) {
            return word.substring(0, word.length() - 2);
        }
        if (word.length() > 3 && word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us") && !word.endsWith("is")) {
            return word.substring(0, word.length() - 1);
        }
        return word;
    }

    /** Jaccard similarity: shared words ÷ all distinct words (0 = nothing in common, 1 = same words). */
    public static double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) {
            return 0;
        }
        long shared = a.stream().filter(b::contains).count();
        return (double) shared / (a.size() + b.size() - shared);
    }
}
