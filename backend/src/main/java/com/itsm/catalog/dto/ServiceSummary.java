package com.itsm.catalog.dto;

import com.itsm.catalog.BusinessCriticality;
import com.itsm.catalog.ITService;

/** Compact service reference embedded in other responses (SLA policies, incidents). */
public record ServiceSummary(Long id, String name, BusinessCriticality criticality) {

    public static ServiceSummary from(ITService service) {
        return service == null ? null : new ServiceSummary(service.getId(), service.getName(), service.getCriticality());
    }
}
