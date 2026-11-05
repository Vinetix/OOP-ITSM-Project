package com.itsm.common.web;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Stable JSON shape for paginated lists (incident search, audit log, ...).
 * We don't return Spring's Page directly because its JSON format is not
 * guaranteed to stay the same; the frontend relies on these exact fields.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
